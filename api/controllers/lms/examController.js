import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';
import { ensureExamSchema, getNextId } from '../teacher/activityController.js';

const DEFAULT_ANTI_CHEAT = {
  enabled: true,
  require_fullscreen: true,
  detect_tab_switch: true,
  max_warnings: 2,
  block_copy_paste: true,
  shuffle_questions: false
};

// GET exam details and questions
export const getExamDetails = async (req, res) => {
  const { activity_id: activityId, student_id: studentId } = req.query;

  if (!activityId || !studentId) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    await ensureExamSchema(pool);

    // 1. Fetch Exam Info
    let activities;
    try {
      [activities] = await pool.query(
        "SELECT id, title, description, category, max_score, time_limit_minutes, max_attempts, anti_cheat_config, open_date, due_date FROM activities WHERE id = ?",
        [activityId]
      );
    } catch (_) {
      [activities] = await pool.query(
        "SELECT id, title, description, category, max_score, time_limit_minutes, max_attempts FROM activities WHERE id = ?",
        [activityId]
      );
    }

    if (activities.length === 0) {
      return res.status(404).json({ status: "error", message: "Activity not found" });
    }

    const activity = activities[0];

    // Availability window (open date / due date)
    const nowMs = Date.now();
    const fmt = (d) => {
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
      } catch (_) {
        return String(d);
      }
    };
    if (activity.open_date && nowMs < new Date(activity.open_date).getTime()) {
      return res.json({
        status: "error",
        not_available: true,
        message: `This exam is not open yet. It opens on ${fmt(activity.open_date)}.`
      });
    }
    const dueMs = activity.due_date ? new Date(activity.due_date).getTime() : null;
    if (dueMs && nowMs > dueMs) {
      // Allow viewing the result if already taken; otherwise it is closed
      activity.is_closed = true;
    }
    let antiCheat = { ...DEFAULT_ANTI_CHEAT };
    if (activity.anti_cheat_config) {
      try {
        antiCheat = { ...DEFAULT_ANTI_CHEAT, ...JSON.parse(activity.anti_cheat_config) };
      } catch (_) {}
    }
    activity.anti_cheat = antiCheat;

    // Resolve both string student_id and numeric id
    const [stuRows] = await pool.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [studentId, studentId]
    );
    const idCandidates = Array.from(new Set([
      String(studentId),
      ...(stuRows[0]?.id ? [String(stuRows[0].id)] : []),
      ...(stuRows[0]?.student_id ? [String(stuRows[0].student_id)] : [])
    ]));

    // 2. Check Attempts and Score
    let scores;
    try {
      [scores] = await pool.query(
        "SELECT score, status, attempts, violation_count, auto_submit_reason FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?) ORDER BY attempts DESC LIMIT 1",
        [activityId, idCandidates]
      );
    } catch (_) {
      [scores] = await pool.query(
        "SELECT score, status, attempts FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?) ORDER BY attempts DESC LIMIT 1",
        [activityId, idCandidates]
      );
    }

    const existingRecord = scores.length > 0 ? scores[0] : null;
    const currentAttempts = existingRecord ? parseInt(existingRecord.attempts || 0, 10) : 0;
    const maxAttempts = activity.max_attempts ? parseInt(activity.max_attempts, 10) : 1;
    const canRetake = !activity.is_closed && currentAttempts < maxAttempts;

    // 3. Fetch Questions
    const [questions] = await pool.query(
      "SELECT id, question_text, question_type, points FROM exam_questions WHERE activity_id = ? ORDER BY order_num ASC",
      [activityId]
    );

    for (let q of questions) {
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false' || q.question_type === 'checkboxes') {
        const [choices] = await pool.query(
          "SELECT id, choice_text FROM exam_choices WHERE question_id = ? ORDER BY id ASC",
          [q.id]
        );
        q.choices = choices;
      } else if (q.question_type === 'enumeration') {
        const [choices] = await pool.query(
          "SELECT COUNT(*) as item_count FROM exam_choices WHERE question_id = ?",
          [q.id]
        );
        q.choices = [];
        q.expected_items = choices[0]?.item_count || 3;
      } else {
        q.choices = [];
      }
    }

    // Shuffle questions if anti_cheat.shuffle_questions is enabled
    if (antiCheat.shuffle_questions && questions.length > 1) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    activity.questions = questions;
    activity.seconds_until_due = dueMs ? Math.max(0, Math.floor((dueMs - Date.now()) / 1000)) : null;

    // If student has already taken the exam at least once:
    // If closed or max attempts reached -> cannot retake.
    // If open and attempts remaining -> can retake (highest score kept).
    if (currentAttempts > 0) {
      return res.json({
        status: "success",
        already_taken: true,
        can_retake: canRetake,
        retake_blocked_reason: activity.is_closed ? "activity_closed" : (currentAttempts >= maxAttempts ? "max_attempts_reached" : null),
        current_attempts: currentAttempts,
        max_attempts: maxAttempts,
        data: activity,
        score_details: {
          score: existingRecord ? parseFloat(existingRecord.score || 0) : 0,
          total: parseFloat(activity.max_score || 0),
          violation_count: existingRecord ? parseInt(existingRecord.violation_count || 0, 10) : 0,
          auto_submit_reason: existingRecord?.auto_submit_reason || null,
          can_retake: canRetake,
          is_closed: activity.is_closed,
          current_attempts: currentAttempts,
          max_attempts: maxAttempts
        }
      });
    }

    // If activity is closed and student never took it
    if (activity.is_closed) {
      return res.json({
        status: "error",
        not_available: true,
        message: `This activity is already closed. The deadline was ${fmt(activity.due_date)}.`
      });
    }

    return res.json({
      status: "success",
      already_taken: false,
      current_attempts: currentAttempts,
      max_attempts: maxAttempts,
      data: activity
    });

  } catch (error) {
    console.error("Get exam details error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// SUBMIT exam answers and calculate scores (with anti-cheat violation tracking)
export const submitExam = async (req, res) => {
  const {
    student_id: rawStudentId,
    activity_id: activityId,
    answers = {},
    auto_submit_reason = null,
    violation_count = 0,
    violation_log = []
  } = req.body;

  if (!rawStudentId || !activityId) {
    return res.status(400).json({ status: "error", message: "Incomplete data" });
  }

  await ensureExamSchema(pool);

  // Enforce the deadline (2-minute grace so an in-progress exam that hits the deadline can still submit)
  try {
    const [dl] = await pool.query("SELECT due_date FROM activities WHERE id = ?", [activityId]);
    if (dl[0]?.due_date && Date.now() > new Date(dl[0].due_date).getTime() + 120000) {
      return res.status(403).json({ status: "error", message: "This exam is already closed. Submissions are no longer accepted." });
    }
  } catch (_) {}

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Resolve canonical student_id & numeric id
    const [stuRows] = await connection.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [rawStudentId, rawStudentId]
    );
    const canonicalStudentId = stuRows[0]?.student_id || rawStudentId;
    const idCandidates = Array.from(new Set([
      String(rawStudentId),
      String(canonicalStudentId),
      ...(stuRows[0]?.id ? [String(stuRows[0].id)] : [])
    ]));

    // Verify activity deadline (No retakes after close date)
    const [actRows] = await connection.query(
      "SELECT id, due_date, max_attempts FROM activities WHERE id = ?",
      [activityId]
    );
    if (actRows.length > 0 && actRows[0].due_date) {
      const dueTime = new Date(actRows[0].due_date).getTime();
      if (Date.now() > dueTime) {
        const [prevAttempts] = await connection.query(
          "SELECT attempts FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?)",
          [activityId, idCandidates]
        );
        if (prevAttempts.length > 0 && Number(prevAttempts[0].attempts || 0) > 0) {
          await connection.rollback();
          return res.status(403).json({
            status: "error",
            message: "This activity is already closed. Retakes are not allowed after the due date."
          });
        }
      }
    }

    // Fetch all questions for this exam so total maxScore is always accurate even if some questions were left blank
    const [allQuestions] = await connection.query(
      "SELECT id, question_type, points FROM exam_questions WHERE activity_id = ? ORDER BY order_num ASC",
      [activityId]
    );

    let totalScore = 0;
    let maxScore = 0;
    let hasEssay = false;

    // Delete existing responses for this student & exam first
    await connection.query(
      "DELETE FROM student_exam_answers WHERE student_id IN (?) AND activity_id = ?",
      [idCandidates, activityId]
    );

    let nextAnswerId = await getNextId(connection, 'student_exam_answers');

    for (const q of allQuestions) {
      const questionId = q.id;
      const answer = answers[questionId] ?? answers[String(questionId)] ?? null;
      const points = parseFloat(q.points || 0);
      maxScore += points;

      let pointsEarned = 0;
      let selectedChoiceId = null;
      let essayAnswer = null;
      const qType = q.question_type || 'multiple_choice';

      if (qType === 'multiple_choice' || qType === 'true_false') {
        if (answer !== null && answer !== undefined && answer !== '') {
          selectedChoiceId = parseInt(answer, 10) || null;
          if (selectedChoiceId) {
            const [cRows] = await connection.query(
              "SELECT is_correct, choice_text FROM exam_choices WHERE id = ?",
              [selectedChoiceId]
            );
            if (cRows.length > 0 && Number(cRows[0].is_correct) === 1) {
              pointsEarned = points;
              totalScore += points;
            }
          }
        }
      } else if (qType === 'checkboxes') {
        const selectedIds = Array.isArray(answer)
          ? answer.map(id => parseInt(id, 10)).filter(Boolean)
          : [];
        essayAnswer = JSON.stringify(selectedIds);

        const [cRows] = await connection.query(
          "SELECT id, choice_text, is_correct FROM exam_choices WHERE question_id = ?",
          [questionId]
        );
        const correctIds = cRows.filter(c => Number(c.is_correct) === 1).map(c => Number(c.id));

        if (
          correctIds.length > 0 &&
          selectedIds.length === correctIds.length &&
          correctIds.every(id => selectedIds.includes(id))
        ) {
          pointsEarned = points;
          totalScore += points;
        }
      } else if (qType === 'identification' || qType === 'fill_blank') {
        const studentText = String(answer ?? '').trim();
        essayAnswer = studentText;

        if (studentText) {
          const [cRows] = await connection.query(
            "SELECT choice_text FROM exam_choices WHERE question_id = ? AND is_correct = 1",
            [questionId]
          );
          const normStudent = studentText.toLowerCase().replace(/\s+/g, ' ');
          const isMatch = cRows.some(c => {
            const acceptedVariants = String(c.choice_text || '')
              .split(',')
              .map(s => s.trim().toLowerCase().replace(/\s+/g, ' '))
              .filter(Boolean);
            return acceptedVariants.includes(normStudent);
          });

          if (isMatch) {
            pointsEarned = points;
            totalScore += points;
          }
        }
      } else if (qType === 'enumeration') {
        const studentItems = Array.isArray(answer)
          ? answer.map(s => String(s ?? '').trim()).filter(Boolean)
          : String(answer ?? '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
        essayAnswer = studentItems.join('\n');

        if (studentItems.length > 0) {
          const [cRows] = await connection.query(
            "SELECT choice_text FROM exam_choices WHERE question_id = ? AND is_correct = 1",
            [questionId]
          );
          const expectedLower = cRows
            .map(c => String(c.choice_text || '').trim().toLowerCase().replace(/\s+/g, ' '))
            .filter(Boolean);

          if (expectedLower.length > 0) {
            const matchedSet = new Set();
            studentItems.forEach(item => {
              const lower = item.toLowerCase().replace(/\s+/g, ' ');
              if (expectedLower.includes(lower)) {
                matchedSet.add(lower);
              }
            });
            const ratio = Math.min(1, matchedSet.size / expectedLower.length);
            pointsEarned = Math.round(points * ratio * 100) / 100;
            totalScore += pointsEarned;
          }
        }
      } else {
        // Essay / paragraph (requires teacher grading)
        hasEssay = true;
        essayAnswer = answer ? String(answer) : '';
      }

      // Insert new response under canonical student_id with explicit ID
      await connection.query(
        `INSERT INTO student_exam_answers 
         (id, student_id, activity_id, question_id, selected_choice_id, essay_answer, points_earned) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nextAnswerId++, String(canonicalStudentId), activityId, questionId, selectedChoiceId, essayAnswer, pointsEarned]
      );
    }

    const finalStatus = hasEssay ? 'Submitted' : 'Graded';
    const parsedViolations = parseInt(violation_count || 0, 10) || 0;
    const violationLogStr = Array.isArray(violation_log) ? JSON.stringify(violation_log) : (violation_log || null);

    // Check if student already has a row in student_activity_scores (under numeric or string ID)
    const [existingSas] = await connection.query(
      "SELECT id, score, attempts FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?)",
      [activityId, idCandidates]
    );

    let recordedScore = totalScore;
    let previousBest = null;

    if (existingSas.length > 0) {
      previousBest = existingSas[0].score !== null && existingSas[0].score !== undefined
        ? parseFloat(existingSas[0].score)
        : null;

      // RULE: Always record the highest score between previous attempts and current attempt
      recordedScore = previousBest !== null ? Math.max(previousBest, totalScore) : totalScore;

      for (const row of existingSas) {
        try {
          await connection.query(
            `UPDATE student_activity_scores
             SET student_id = ?, score = ?, status = ?, date_graded = NOW(),
                 attempts = COALESCE(attempts, 0) + 1,
                 violation_count = ?, auto_submit_reason = ?, violation_log = ?
             WHERE id = ?`,
            [String(canonicalStudentId), recordedScore, finalStatus, parsedViolations, auto_submit_reason || null, violationLogStr, row.id]
          );
        } catch (_) {
          await connection.query(
            `UPDATE student_activity_scores
             SET student_id = ?, score = ?, status = ?, date_graded = NOW(),
                 attempts = COALESCE(attempts, 0) + 1
             WHERE id = ?`,
            [String(canonicalStudentId), recordedScore, finalStatus, row.id]
          );
        }
      }
    } else {
      const nextSasId = await getNextId(connection, 'student_activity_scores');
      try {
        await connection.query(
          `INSERT INTO student_activity_scores
           (id, activity_id, student_id, score, status, date_graded, attempts, violation_count, auto_submit_reason, violation_log)
           VALUES (?, ?, ?, ?, ?, NOW(), 1, ?, ?, ?)`,
          [nextSasId, activityId, String(canonicalStudentId), totalScore, finalStatus, parsedViolations, auto_submit_reason || null, violationLogStr]
        );
      } catch (_) {
        await connection.query(
          `INSERT INTO student_activity_scores
           (id, activity_id, student_id, score, status, date_graded, attempts)
           VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
          [nextSasId, activityId, String(canonicalStudentId), totalScore, finalStatus]
        );
      }
    }

    await connection.commit();
    await logAuditTrail(
      1,
      'student',
      "SUBMIT_EXAMINATION",
      `Student ID: ${canonicalStudentId} submitted Exam #${activityId} (Score: ${totalScore}/${maxScore}, Recorded Best: ${recordedScore}/${maxScore}, Violations: ${parsedViolations}${auto_submit_reason ? `, Reason: ${auto_submit_reason}` : ''})`,
      req
    );

    return res.json({
      status: "success",
      score_details: {
        score: recordedScore,
        attempt_score: totalScore,
        highest_score: recordedScore,
        total: maxScore,
        violation_count: parsedViolations,
        auto_submit_reason: auto_submit_reason || null
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Submit exam error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export default { getExamDetails, submitExam };
