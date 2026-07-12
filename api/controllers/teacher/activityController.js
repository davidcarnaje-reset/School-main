import pool from '../../config/db.js';

// CREATE STANDARD CLASSROOM ACTIVITY
export const createActivity = async (req, res) => {
  const { class_id, teacher_id, title, category, description, max_score, due_date, quarter } = req.body;

  if (!class_id || !teacher_id || !title || !category) {
    return res.status(400).json({ status: "error", message: "Missing required fields." });
  }

  const parsedQuarter = quarter ? parseInt(quarter, 10) : null;
  const parsedMaxScore = max_score ? parseFloat(max_score) : 100;
  const finalDueDate = due_date || null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert into activities
    const [result] = await connection.query(
      `INSERT INTO activities (class_id, quarter, teacher_id, title, description, category, max_score, due_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [class_id, parsedQuarter, teacher_id, title, description || null, category, parsedMaxScore, finalDueDate]
    );

    const activityId = result.insertId;

    // 2. Fetch all enrolled students
    const [students] = await connection.query(
      "SELECT student_id FROM enrolled_classes WHERE class_assignment_id = ? AND status = 'Enrolled'",
      [class_id]
    );

    // 3. Assign to students with 'Pending' status
    if (students.length > 0) {
      const insertPromises = students.map(s => 
        connection.query(
          "INSERT INTO student_activity_scores (activity_id, student_id, score, status) VALUES (?, ?, 0, 'Pending')",
          [activityId, s.student_id]
        )
      );
      await Promise.all(insertPromises);
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "Activity created successfully.",
      data: { activity_id: activityId }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Create activity error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

// CREATE QUARTERLY EXAM / QUIZ
export const createExam = async (req, res) => {
  const { teacher_id, exam_details, questions } = req.body;

  if (!teacher_id || !exam_details || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ status: "error", message: "Missing required exam data." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Calculate the total max_score based on the points of all questions
    let maxScore = 0;
    questions.forEach(q => {
      maxScore += parseFloat(q.points || 0);
    });

    const parsedQuarter = exam_details.quarter ? parseInt(exam_details.quarter, 10) : null;
    const finalDueDate = exam_details.due_date || null;

    // 2. Insert the main activity
    const [actResult] = await connection.query(
      `INSERT INTO activities (class_id, quarter, teacher_id, title, description, category, max_score, due_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exam_details.class_id,
        parsedQuarter,
        teacher_id,
        exam_details.title,
        exam_details.description || null,
        exam_details.category || 'exam',
        maxScore,
        finalDueDate
      ]
    );

    const activityId = actResult.insertId;

    // 3. Loop through and Insert all Questions
    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      const [qResult] = await connection.query(
        "INSERT INTO exam_questions (activity_id, question_text, question_type, points, order_num) VALUES (?, ?, ?, ?, ?)",
        [activityId, q.text, q.type, q.points, index + 1]
      );
      const questionId = qResult.insertId;

      // 4. Insert choices if multiple choice
      if (q.type === 'multiple_choice' && Array.isArray(q.choices)) {
        for (let cIndex = 0; cIndex < q.choices.length; cIndex++) {
          const choiceText = q.choices[cIndex];
          const isCorrect = cIndex === parseInt(q.correctChoiceIndex, 10) ? 1 : 0;
          await connection.query(
            "INSERT INTO exam_choices (question_id, choice_text, is_correct) VALUES (?, ?, ?)",
            [questionId, choiceText, isCorrect]
          );
        }
      }
    }

    // 5. Assign to Enrolled Students
    const [students] = await connection.query(
      "SELECT student_id FROM enrolled_classes WHERE class_assignment_id = ? AND status = 'Enrolled'",
      [exam_details.class_id]
    );

    if (students.length > 0) {
      const insertPromises = students.map(s =>
        connection.query(
          "INSERT INTO student_activity_scores (activity_id, student_id, score, status) VALUES (?, ?, 0, 'Pending')",
          [activityId, s.student_id]
        )
      );
      await Promise.all(insertPromises);
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "Examination created successfully.",
      data: { activity_id: activityId }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Create exam error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

// GET CLASSROOM ACTIVITIES
export const getActivities = async (req, res) => {
  const classId = req.query.class_id ? parseInt(req.query.class_id, 10) : null;
  const category = req.query.category || null;
  const quarter = req.query.quarter ? parseInt(req.query.quarter, 10) : null;
  const all = req.query.all ? parseInt(req.query.all, 10) : 0;

  if (!classId) {
    return res.status(400).json({ status: "error", message: "Class ID required." });
  }

  try {
    let sql = "SELECT * FROM activities WHERE class_id = ?";
    const params = [classId];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (quarter) {
      sql += " AND quarter = ?";
      params.push(quarter);
    } else {
      if (all !== 1) {
        sql += " AND quarter IS NULL";
      }
    }

    sql += " ORDER BY created_at DESC";

    const [activities] = await pool.query(sql, params);

    return res.json({
      status: "success",
      data: activities,
      count: activities.length
    });

  } catch (error) {
    console.error("Get activities error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default { createActivity, createExam, getActivities };
