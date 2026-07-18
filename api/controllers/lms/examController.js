import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// GET exam details and questions
export const getExamDetails = async (req, res) => {
  const { activity_id: activityId, student_id: studentId } = req.query;

  if (!activityId || !studentId) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    // 1. Fetch Exam Info
    const [activities] = await pool.query(
      "SELECT id, title, description, category, max_score, time_limit_minutes, max_attempts FROM activities WHERE id = ?",
      [activityId]
    );

    if (activities.length === 0) {
      return res.status(404).json({ status: "error", message: "Activity not found" });
    }

    const activity = activities[0];

    // 2. Check Attempts and Score
    const [scores] = await pool.query(
      "SELECT score, status, attempts FROM student_activity_scores WHERE activity_id = ? AND student_id = ?",
      [activityId, studentId]
    );

    const existingRecord = scores.length > 0 ? scores[0] : null;
    const currentAttempts = existingRecord ? parseInt(existingRecord.attempts || 0, 10) : 0;
    const maxAttempts = activity.max_attempts ? parseInt(activity.max_attempts, 10) : 1;

    if (currentAttempts >= maxAttempts) {
      return res.json({
        status: "success",
        already_taken: true,
        score_details: {
          score: existingRecord ? parseFloat(existingRecord.score || 0) : 0,
          total: parseFloat(activity.max_score || 0)
        }
      });
    }

    // 3. Fetch Questions
    const [questions] = await pool.query(
      "SELECT id, question_text, question_type, points FROM exam_questions WHERE activity_id = ? ORDER BY order_num ASC",
      [activityId]
    );

    for (let q of questions) {
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        const [choices] = await pool.query(
          "SELECT id, choice_text FROM exam_choices WHERE question_id = ?",
          [q.id]
        );
        q.choices = choices;
      } else {
        q.choices = [];
      }
    }

    activity.questions = questions;

    return res.json({
      status: "success",
      already_taken: false,
      current_attempts: currentAttempts,
      data: activity
    });

  } catch (error) {
    console.error("Get exam details error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// SUBMIT exam answers and calculate scores
export const submitExam = async (req, res) => {
  const { student_id: studentId, activity_id: activityId, answers } = req.body;

  if (!studentId || !activityId || !answers) {
    return res.status(400).json({ status: "error", message: "Incomplete data" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let totalScore = 0;
    let maxScore = 0;

    // answers is expected to be an object: { questionId: answerVal }
    for (const [questionId, answer] of Object.entries(answers)) {
      const [qRows] = await connection.query(
        "SELECT question_type, points FROM exam_questions WHERE id = ?",
        [questionId]
      );

      if (qRows.length === 0) continue;

      const q = qRows[0];
      const points = parseFloat(q.points || 0);
      maxScore += points;

      let pointsEarned = 0;
      let selectedChoiceId = null;
      let essayAnswer = null;

      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        selectedChoiceId = answer;
        const [cRows] = await connection.query(
          "SELECT is_correct FROM exam_choices WHERE id = ?",
          [selectedChoiceId]
        );
        if (cRows.length > 0 && cRows[0].is_correct) {
          pointsEarned = points;
          totalScore += points;
        }
      } else {
        essayAnswer = answer;
      }

      // Delete existing response
      await connection.query(
        "DELETE FROM student_exam_answers WHERE student_id = ? AND activity_id = ? AND question_id = ?",
        [studentId, activityId, questionId]
      );

      // Insert new response
      await connection.query(
        `INSERT INTO student_exam_answers 
         (student_id, activity_id, question_id, selected_choice_id, essay_answer, points_earned) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, activityId, questionId, selectedChoiceId, essayAnswer, pointsEarned]
      );
    }

    // Upsert into student_activity_scores
    await connection.query(
      `INSERT INTO student_activity_scores (activity_id, student_id, score, status, date_graded, attempts) 
       VALUES (?, ?, ?, 'Graded', NOW(), 1)
       ON DUPLICATE KEY UPDATE score = ?, status = 'Graded', date_graded = NOW(), attempts = attempts + 1`,
      [activityId, studentId, totalScore, totalScore]
    );

    await connection.commit();
    await logAuditTrail(
      1,
      'student',
      "SUBMIT_EXAMINATION",
      `Student ID: ${studentId} submitted answers for Examination ID: ${activityId} (Score: ${totalScore}/${maxScore})`,
      req
    );

    return res.json({
      status: "success",
      score_details: {
        score: totalScore,
        total: maxScore
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
