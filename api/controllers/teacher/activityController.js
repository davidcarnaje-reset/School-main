import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';
import { ensureClassAnnouncementsTable } from './announcementsController.js';

// Helper to get all student IDs (numeric id & string student_id) enrolled in a class/section
const getClassEnrolledStudents = async (connection, classId) => {
  const [classRows] = await connection.query(
    `SELECT ca.id, ca.section_id, ca.teacher_id, s.subject_code, s.subject_description, sec.section_name
     FROM class_assignments ca
     LEFT JOIN subjects s ON ca.subject_id = s.id
     LEFT JOIN sections sec ON ca.section_id = sec.id
     WHERE ca.id = ? LIMIT 1`,
    [classId]
  );
  const classInfo = classRows[0] || {};

  // Ensure students in enrollments for this section are also in enrolled_classes
  if (classInfo.section_id) {
    const [secStudents] = await connection.query(
      `SELECT DISTINCT s.id as numeric_id, s.student_id
       FROM enrollments e
       JOIN students s ON (e.student_id = s.student_id OR e.student_id = s.id)
       WHERE e.section_id = ? AND e.status = 'Enrolled'`,
      [classInfo.section_id]
    );
    for (const st of secStudents) {
      if (st.numeric_id) {
        const [exists] = await connection.query(
          "SELECT id FROM enrolled_classes WHERE student_id = ? AND class_assignment_id = ? LIMIT 1",
          [st.numeric_id, classId]
        );
        if (exists.length === 0) {
          await connection.query(
            "INSERT INTO enrolled_classes (student_id, class_assignment_id, status) VALUES (?, ?, 'Enrolled')",
            [st.numeric_id, classId]
          );
        }
      }
    }
  }

  const [students] = await connection.query(
    `SELECT DISTINCT ec.student_id as ec_student_id, s.id as numeric_id, s.student_id as string_id
     FROM enrolled_classes ec
     LEFT JOIN students s ON (ec.student_id = s.id OR ec.student_id = s.student_id)
     WHERE ec.class_assignment_id = ? AND ec.status = 'Enrolled'`,
    [classId]
  );

  return { classInfo, students };
};

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

    // 2. Fetch all enrolled students (syncing section enrollments automatically)
    const { students } = await getClassEnrolledStudents(connection, class_id);

    // 3. Assign to students with 'Pending' status
    if (students.length > 0) {
      const insertPromises = students.map(s =>
        connection.query(
          "INSERT INTO student_activity_scores (activity_id, student_id, score, status) VALUES (?, ?, 0, 'Pending')",
          [activityId, s.ec_student_id]
        )
      );
      await Promise.all(insertPromises);
    }

    await connection.commit();
    await logAuditTrail(
      req.user?.id || teacher_id || 1,
      req.user?.role || 'Teacher',
      "CREATE_ACTIVITY",
      `Created standard activity: ${title} for Class ID: ${class_id}`,
      req
    );

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
    const { students } = await getClassEnrolledStudents(connection, exam_details.class_id);

    if (students.length > 0) {
      const insertPromises = students.map(s =>
        connection.query(
          "INSERT INTO student_activity_scores (activity_id, student_id, score, status) VALUES (?, ?, 0, 'Pending')",
          [activityId, s.ec_student_id]
        )
      );
      await Promise.all(insertPromises);
    }

    await connection.commit();
    await logAuditTrail(
      req.user?.id || teacher_id || 1,
      req.user?.role || 'Teacher',
      "CREATE_EXAMINATION",
      `Created exam: ${exam_details.title} for Class ID: ${exam_details.class_id}`,
      req
    );

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

// SHARE ACTIVITY TO STUDENTS (NOTIFY & POST TO STREAM)
export const shareActivity = async (req, res) => {
  const { activity_id, class_id, title } = req.body;

  if (!class_id || !title) {
    return res.status(400).json({ status: "error", message: "Class ID and activity title are required." });
  }

  const connection = await pool.getConnection();
  try {
    await ensureClassAnnouncementsTable();
    await connection.beginTransaction();

    const { classInfo, students } = await getClassEnrolledStudents(connection, class_id);
    const subjectLabel = classInfo.subject_description || classInfo.subject_code || 'Class';
    const teacherId = req.user?.id || classInfo.teacher_id || 1;

    // Fetch activity details if activity_id provided
    let activityDesc = `New classwork "${title}" has been posted in ${subjectLabel}. Please check your LMS Classroom to view and complete it.`;
    if (activity_id) {
      const [actRows] = await connection.query("SELECT description, due_date, max_score FROM activities WHERE id = ? LIMIT 1", [activity_id]);
      if (actRows.length > 0 && actRows[0].description) {
        activityDesc = `${actRows[0].description}${actRows[0].due_date ? ` (Due: ${new Date(actRows[0].due_date).toLocaleDateString()})` : ''}`;
      }
    }

    // 1. Insert into class_announcements so it shows up on the Stream as well
    await connection.query(
      `INSERT INTO class_announcements (class_id, teacher_id, title, message, type)
       VALUES (?, ?, ?, ?, 'Task Reminder')`,
      [class_id, teacherId, `New Activity: ${title}`, activityDesc]
    );

    // 2. Insert into notifications & notification_recipients
    const [notifRes] = await connection.query(
      `INSERT INTO notifications (sender_id, sender_role, type, title, message, created_at)
       VALUES (?, 'teacher', 'Task Reminder', ?, ?, NOW())`,
      [teacherId, `[${subjectLabel}] ${title}`, activityDesc]
    );
    const notificationId = notifRes.insertId;

    const recipientSet = new Set();
    for (const s of students) {
      if (s.string_id) recipientSet.add(String(s.string_id));
      if (s.numeric_id) recipientSet.add(String(s.numeric_id));
    }

    if (recipientSet.size > 0) {
      const recipientValues = Array.from(recipientSet).map(sid => [notificationId, sid, 'student', 0]);
      await connection.query(
        `INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role, is_read) VALUES ?`,
        [recipientValues]
      );
    } else {
      await connection.query(
        `INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role, is_read) VALUES (?, 'all', 'student', 0)`,
        [notificationId]
      );
    }

    await connection.commit();
    return res.json({
      status: "success",
      message: "Activity shared to all students in the class!"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Share activity error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export default { createActivity, createExam, getActivities, shareActivity };
