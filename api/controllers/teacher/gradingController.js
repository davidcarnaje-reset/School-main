import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';
import { ensureExamSchema, getNextId } from './activityController.js';

// GET ACTIVITY SCORES & SUBMISSIONS FOR CLASS
export const getActivityScores = async (req, res) => {
  const activityId = req.query.activity_id ? parseInt(req.query.activity_id, 10) : null;
  const classIdParam = req.query.class_id ? parseInt(req.query.class_id, 10) : null;
  const quarterParam = req.query.quarter ? parseInt(req.query.quarter, 10) : null;

  await ensureExamSchema(pool);

  if (!activityId && classIdParam) {
    try {
      let sql = `
        SELECT sas.activity_id, sas.student_id, sas.score, sas.status, sas.violation_count, sas.auto_submit_reason, a.category, a.max_score, a.title
        FROM student_activity_scores sas
        JOIN activities a ON sas.activity_id = a.id
        WHERE a.class_id = ?
      `;
      const params = [classIdParam];
      if (quarterParam) {
        sql += ` AND a.quarter = ?`;
        params.push(quarterParam);
      }
      const [rows] = await pool.query(sql, params);
      return res.json({ status: "success", data: rows });
    } catch (err) {
      console.error("Get class activity scores error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }

  if (!activityId) {
    return res.status(400).json({ status: "error", message: "Activity ID required" });
  }

  try {
    // 1. Get Specific Activity Details
    const actQuery = `
      SELECT 
        a.*, 
        c.subject_id, 
        c.section_id, 
        sub.subject_description as subject_name, 
        sec.section_name 
      FROM activities a
      JOIN class_assignments c ON a.class_id = c.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN sections sec ON c.section_id = sec.id
      WHERE a.id = ?
    `;
    const [actRows] = await pool.query(actQuery, [activityId]);

    if (actRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Activity not found" });
    }

    const activity = actRows[0];
    const classId = activity.class_id;

    // 2. Get Student details, scores, submissions, and anti-cheat logs (matching both string student_id and numeric id)
    let scores;
    try {
      const studentsQuery = `
        SELECT DISTINCT
          s.last_name, s.first_name, s.student_id, 
          CONCAT(s.last_name, ', ', s.first_name) AS name,
          COALESCE(sas.score, '') AS score,
          COALESCE(sas.status, 'Pending') AS status,
          COALESCE(sas.violation_count, 0) AS violation_count,
          sas.auto_submit_reason,
          sas.violation_log,
          sub.submission_type,
          sub.submission_content,
          sub.submission_url,
          sub.file_url,
          sub.submitted_at,
          sub.submission_url,
          sub.file_url,
          sub.submitted_at
        FROM enrolled_classes ec
        JOIN students s ON (ec.student_id = s.student_id OR ec.student_id = s.id)
        LEFT JOIN student_activity_scores sas 
          ON (sas.student_id = s.student_id OR sas.student_id = s.id) AND sas.activity_id = ?
        LEFT JOIN student_submissions sub 
          ON (sub.student_id = s.student_id OR sub.student_id = s.id) AND sub.activity_id = ?
        WHERE ec.class_assignment_id = ? 
          AND ec.status = 'Enrolled'
        ORDER BY s.last_name ASC, s.first_name ASC
      `;
      [scores] = await pool.query(studentsQuery, [activityId, activityId, classId]);
    } catch (_) {
      const fallbackQuery = `
        SELECT DISTINCT
          s.last_name, s.first_name, s.student_id, 
          CONCAT(s.last_name, ', ', s.first_name) AS name,
          COALESCE(sas.score, '') AS score,
          COALESCE(sas.status, 'Pending') AS status,
          sub.submission_type,
          sub.submission_content
        FROM enrolled_classes ec
        JOIN students s ON (ec.student_id = s.student_id OR ec.student_id = s.id)
        LEFT JOIN student_activity_scores sas 
          ON (sas.student_id = s.student_id OR sas.student_id = s.id) AND sas.activity_id = ?
        LEFT JOIN student_submissions sub 
          ON (sub.student_id = s.student_id OR sub.student_id = s.id) AND sub.activity_id = ?
        WHERE ec.class_assignment_id = ? 
          AND ec.status = 'Enrolled'
        ORDER BY s.last_name ASC, s.first_name ASC
      `;
      [scores] = await pool.query(fallbackQuery, [activityId, activityId, classId]);
    }

    return res.json({
      status: "success",
      activity,
      scores
    });

  } catch (error) {
    console.error("Get activity scores error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// GET EXAM QUESTIONS WITH STUDENT RESPONSES FOR GRADING
export const getExamQuestions = async (req, res) => {
  const { activity_id: activityId, student_id: studentId } = req.query;

  if (!activityId || !studentId) {
    return res.status(400).json({ status: "error", message: "Activity ID and Student ID required." });
  }

  try {
    await ensureExamSchema(pool);

    // Resolve both string and numeric student_id
    const [stuRows] = await pool.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [studentId, studentId]
    );
    const idCandidates = Array.from(new Set([
      String(studentId),
      ...(stuRows[0]?.id ? [String(stuRows[0].id)] : []),
      ...(stuRows[0]?.student_id ? [String(stuRows[0].student_id)] : [])
    ]));

    // Fetch anti-cheat summary from student_activity_scores
    let proctoringInfo = { violation_count: 0, auto_submit_reason: null, violation_log: null };
    try {
      const [sasRows] = await pool.query(
        "SELECT violation_count, auto_submit_reason, violation_log FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?) LIMIT 1",
        [activityId, idCandidates]
      );
      if (sasRows.length > 0) proctoringInfo = sasRows[0];
    } catch (_) {}

    // 1. Get all questions
    const [questions] = await pool.query(
      `SELECT id, question_text, question_type, points as max_points, order_num
       FROM exam_questions
       WHERE activity_id = ?
       ORDER BY order_num ASC`,
      [activityId]
    );

    const result = [];

    for (let q of questions) {
      const questionId = q.id;

      // 2. Get student's response
      const [answers] = await pool.query(
        `SELECT selected_choice_id, essay_answer, points_earned
         FROM student_exam_answers
         WHERE activity_id = ? AND student_id IN (?) AND question_id = ?
         LIMIT 1`,
        [activityId, idCandidates, questionId]
      );

      const answer = answers[0] || null;
      let studentAnswerText = null;
      let isCorrect = false;
      let pointsEarned = answer ? parseFloat(answer.points_earned || 0) : 0;

      const [cRows] = await pool.query(
        "SELECT id, choice_text, is_correct FROM exam_choices WHERE question_id = ? ORDER BY id ASC",
        [questionId]
      );
      const choices = cRows;
      let correctChoiceId = null;
      const correctTexts = cRows.filter(c => Number(c.is_correct) === 1).map(c => c.choice_text);

      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        choices.forEach(c => {
          if (Number(c.is_correct) === 1) {
            correctChoiceId = c.id;
          }
          if (answer && String(c.id) === String(answer.selected_choice_id)) {
            studentAnswerText = c.choice_text;
            if (Number(c.is_correct) === 1) {
              isCorrect = true;
              pointsEarned = parseFloat(q.max_points || 0);
            }
          }
        });
      } else if (
        q.question_type === 'checkboxes' ||
        q.question_type === 'identification' ||
        q.question_type === 'fill_blank' ||
        q.question_type === 'enumeration'
      ) {
        studentAnswerText = answer ? answer.essay_answer : null;
        isCorrect = pointsEarned >= parseFloat(q.max_points || 0) && parseFloat(q.max_points || 0) > 0;
      } else {
        studentAnswerText = answer ? answer.essay_answer : null;
      }

      result.push({
        id: questionId,
        question_text: q.question_text,
        question_type: q.question_type,
        max_points: parseFloat(q.max_points || 0),
        order_num: q.order_num,
        student_answer: studentAnswerText,
        points_earned: pointsEarned,
        is_correct: isCorrect,
        choices: choices,
        correct_choice_id: correctChoiceId,
        correct_answer_text: correctTexts.join(', '),
        essay_answer: answer ? answer.essay_answer : null
      });
    }

    return res.json({
      status: "success",
      questions: result,
      proctoring: proctoringInfo
    });

  } catch (error) {
    console.error("Get exam questions error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// SAVE / UPDATE ACTIVITY SCORES
export const saveActivityScores = async (req, res) => {
  const { activity_id, student_id, score: reqScore, essay_scores } = req.body;

  if (!activity_id || !student_id) {
    return res.status(400).json({ status: "error", message: "Invalid request. Activity ID and Student ID are required." });
  }

  const activityId = parseInt(activity_id, 10);
  const studentId = student_id;
  let score = reqScore ? parseFloat(reqScore) : 0;
  const essays = essay_scores || [];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Resolve both string and numeric student_id
    const [stuRows] = await connection.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [studentId, studentId]
    );
    const canonicalStudentId = stuRows[0]?.student_id || studentId;
    const idCandidates = Array.from(new Set([
      String(studentId),
      String(canonicalStudentId),
      ...(stuRows[0]?.id ? [String(stuRows[0].id)] : [])
    ]));

    // 1. Get Activity Info
    const [activities] = await connection.query(
      "SELECT class_id, quarter, category, max_score FROM activities WHERE id = ?",
      [activityId]
    );

    if (activities.length === 0) {
      throw new Error("Activity not found.");
    }

    const activity = activities[0];

    // 2. If Essay / manual question scores are provided, save them first
    if (essays.length > 0) {
      for (let essay of essays) {
        await connection.query(
          "UPDATE student_exam_answers SET points_earned = ? WHERE student_id IN (?) AND activity_id = ? AND question_id = ?",
          [parseFloat(essay.score), idCandidates, activityId, parseInt(essay.question_id, 10)]
        );
      }
    }

    // Recalculate Exam total points earned
    const [totals] = await connection.query(
      "SELECT SUM(points_earned) as total FROM student_exam_answers WHERE student_id IN (?) AND activity_id = ?",
      [idCandidates, activityId]
    );

    if (totals[0] && totals[0].total !== null) {
      score = parseFloat(totals[0].total);
    }

    // 3. Save into student_activity_scores with explicit ID if inserting
    const [existingScores] = await connection.query(
      "SELECT id FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?)",
      [activityId, idCandidates]
    );

    if (existingScores.length > 0) {
      for (const row of existingScores) {
        await connection.query(
          "UPDATE student_activity_scores SET score = ?, status = 'Graded', date_graded = NOW() WHERE id = ?",
          [score, row.id]
        );
      }
    } else {
      const nextSasId = await getNextId(connection, 'student_activity_scores');
      await connection.query(
        "INSERT INTO student_activity_scores (id, activity_id, student_id, score, status, date_graded) VALUES (?, ?, ?, ?, 'Graded', NOW())",
        [nextSasId, activityId, String(canonicalStudentId), score]
      );
    }

    // 4. Map and save into student_grades with explicit ID if inserting
    const category = (activity.category || '').toLowerCase();
    const maxScore = parseFloat(activity.max_score || 100);
    const quarter = activity.quarter;
    const classId = activity.class_id;

    let gradeColumn = null;
    const k12Map = {
      written: 'written', quiz: 'written', assignment: 'written', task: 'written',
      performance: 'performance', exam: 'exam', quarterly_exam: 'exam'
    };
    const collegeMap = { prelim: 'prelim', midterm: 'midterm', finals: 'finals' };

    if (k12Map[category]) {
      gradeColumn = k12Map[category];
    } else if (collegeMap[category]) {
      gradeColumn = collegeMap[category];
    } else {
      gradeColumn = 'written';
    }

    if (gradeColumn) {
      const gradePercentage = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;

      const [existingGrades] = await connection.query(
        `SELECT id FROM student_grades WHERE class_id = ? AND student_id IN (?) AND ${quarter ? "quarter = ?" : "quarter IS NULL"}`,
        quarter ? [classId, idCandidates, quarter] : [classId, idCandidates]
      );

      if (existingGrades.length > 0) {
        await connection.query(
          `UPDATE student_grades SET ${gradeColumn} = ? WHERE id = ?`,
          [gradePercentage, existingGrades[0].id]
        );
      } else {
        const nextGradeId = await getNextId(connection, 'student_grades');
        const sql = `INSERT INTO student_grades (id, class_id, student_id, quarter, ${gradeColumn}) VALUES (?, ?, ?, ?, ?)`;
        await connection.query(sql, [nextGradeId, classId, String(canonicalStudentId), quarter || null, gradePercentage]);
      }
    }

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Teacher',
      "SAVE_ACTIVITY_SCORE",
      `Saved score for Student: ${canonicalStudentId} on Activity ID: ${activityId} (Score: ${score})`,
      req
    );

    return res.json({
      status: "success",
      message: "Score saved and gradebook updated!",
      final_score: score
    });

  } catch (error) {
    await connection.rollback();
    console.error("Save activity score error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export default { getActivityScores, getExamQuestions, saveActivityScores };
