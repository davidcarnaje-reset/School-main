import pool from '../../config/db.js';

// GET ACTIVITY SCORES & SUBMISSIONS FOR CLASS
export const getActivityScores = async (req, res) => {
  const activityId = req.query.activity_id ? parseInt(req.query.activity_id, 10) : null;

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

    // 2. Get Student details, scores, and submissions
    const studentsQuery = `
      SELECT 
        s.student_id, 
        CONCAT(s.last_name, ', ', s.first_name) AS name,
        COALESCE(sas.score, '') AS score,
        COALESCE(sas.status, 'Pending') AS status,
        sub.submission_type,
        sub.submission_content
      FROM enrolled_classes ec
      JOIN students s ON ec.student_id = s.student_id
      LEFT JOIN student_activity_scores sas 
        ON sas.student_id = s.student_id AND sas.activity_id = ?
      LEFT JOIN student_submissions sub 
        ON sub.student_id = s.student_id AND sub.activity_id = ?
      WHERE ec.class_assignment_id = ? 
        AND ec.status = 'Enrolled'
      ORDER BY s.last_name ASC, s.first_name ASC
    `;

    const [scores] = await pool.query(studentsQuery, [activityId, activityId, classId]);

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
         WHERE activity_id = ? AND student_id = ? AND question_id = ?
         LIMIT 1`,
        [activityId, studentId, questionId]
      );

      const answer = answers[0] || null;
      let studentAnswerText = null;
      let isCorrect = false;
      let pointsEarned = answer ? parseFloat(answer.points_earned || 0) : 0;

      let choices = [];
      let correctChoiceId = null;

      // 3. Logic for choice items
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        const [cRows] = await pool.query(
          "SELECT id, choice_text, is_correct FROM exam_choices WHERE question_id = ? ORDER BY id ASC",
          [questionId]
        );
        choices = cRows;

        choices.forEach(c => {
          if (c.is_correct === 1) {
            correctChoiceId = c.id;
          }
          if (answer && String(c.id) === String(answer.selected_choice_id)) {
            studentAnswerText = c.choice_text;
            if (c.is_correct === 1) {
              isCorrect = true;
              pointsEarned = parseFloat(q.max_points || 0);
            }
          }
        });
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
        essay_answer: answer ? answer.essay_answer : null
      });
    }

    return res.json({
      status: "success",
      questions: result
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

    // 1. Get Activity Info
    const [activities] = await connection.query(
      "SELECT class_id, quarter, category, max_score FROM activities WHERE id = ?",
      [activityId]
    );

    if (activities.length === 0) {
      throw new Error("Activity not found.");
    }

    const activity = activities[0];

    // 2. If Essay scores are provided, save them first
    if (essays.length > 0) {
      for (let essay of essays) {
        await connection.query(
          "UPDATE student_exam_answers SET points_earned = ? WHERE student_id = ? AND activity_id = ? AND question_id = ?",
          [parseFloat(essay.score), studentId, activityId, parseInt(essay.question_id, 10)]
        );
      }
    }

    // Recalculate Exam total points earned (MC + Essays)
    const [totals] = await connection.query(
      "SELECT SUM(points_earned) as total FROM student_exam_answers WHERE student_id = ? AND activity_id = ?",
      [studentId, activityId]
    );

    if (totals[0] && totals[0].total !== null) {
      score = parseFloat(totals[0].total);
    }

    // 3. Save into student_activity_scores
    const [existingScores] = await connection.query(
      "SELECT id FROM student_activity_scores WHERE activity_id = ? AND student_id = ?",
      [activityId, studentId]
    );

    if (existingScores.length > 0) {
      await connection.query(
        "UPDATE student_activity_scores SET score = ?, status = 'Graded', date_graded = NOW() WHERE id = ?",
        [score, existingScores[0].id]
      );
    } else {
      await connection.query(
        "INSERT INTO student_activity_scores (activity_id, student_id, score, status, date_graded) VALUES (?, ?, ?, 'Graded', NOW())",
        [activityId, studentId, score]
      );
    }

    // 4. Map and save into student_grades
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
      gradeColumn = 'written'; // fallback
    }

    if (gradeColumn) {
      const gradePercentage = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;

      const [existingGrades] = await connection.query(
        `SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND ${quarter ? "quarter = ?" : "quarter IS NULL"}`,
        quarter ? [classId, studentId, quarter] : [classId, studentId]
      );

      if (existingGrades.length > 0) {
        await connection.query(
          `UPDATE student_grades SET ${gradeColumn} = ? WHERE id = ?`,
          [gradePercentage, existingGrades[0].id]
        );
      } else {
        const sql = `INSERT INTO student_grades (class_id, student_id, quarter, ${gradeColumn}) VALUES (?, ?, ?, ?)`;
        await connection.query(sql, [classId, studentId, quarter || null, gradePercentage]);
      }
    }

    await connection.commit();

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
