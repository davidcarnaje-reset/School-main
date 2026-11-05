import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';
import { ensureClassAnnouncementsTable } from './announcementsController.js';
import { ensureClassroomModulesTable } from '../lms/getClassroomFeed.js';

let examSchemaEnsured = false;

// Helper to get next primary key ID manually (TiDB tables lack AUTO_INCREMENT on id)
export const getNextId = async (connOrPool, tableName, idCol = 'id') => {
  const [rows] = await connOrPool.query(
    `SELECT COALESCE(MAX(\`${idCol}\`), 0) + 1 AS nextId FROM \`${tableName}\``
  );
  return parseInt(rows[0]?.nextId || 1, 10);
};

export const ensureExamSchema = async (connOrPool = pool) => {
  if (examSchemaEnsured) return;
  const alterStatements = [
    "ALTER TABLE activities MODIFY COLUMN category VARCHAR(64) NOT NULL DEFAULT 'written'",
    "ALTER TABLE activities ADD COLUMN time_limit_minutes INT NULL DEFAULT NULL",
    "ALTER TABLE activities ADD COLUMN max_attempts INT NULL DEFAULT 1",
    "ALTER TABLE activities ADD COLUMN anti_cheat_config TEXT NULL",
    "ALTER TABLE activities ADD COLUMN open_date DATETIME NULL DEFAULT NULL",
    "ALTER TABLE exam_questions MODIFY COLUMN question_type VARCHAR(64) NOT NULL DEFAULT 'multiple_choice'",
    "ALTER TABLE exam_choices MODIFY COLUMN choice_text TEXT NOT NULL",
    "ALTER TABLE student_activity_scores ADD COLUMN attempts INT NOT NULL DEFAULT 0",
    "ALTER TABLE student_activity_scores ADD COLUMN violation_count INT NOT NULL DEFAULT 0",
    "ALTER TABLE student_activity_scores ADD COLUMN auto_submit_reason VARCHAR(100) NULL DEFAULT NULL",
    "ALTER TABLE student_activity_scores ADD COLUMN violation_log TEXT NULL",
    "ALTER TABLE student_submissions MODIFY COLUMN submission_type VARCHAR(64) NOT NULL DEFAULT 'text'",
    "ALTER TABLE student_submissions ADD COLUMN submission_url VARCHAR(500) NULL DEFAULT NULL"
  ];

  for (const sql of alterStatements) {
    try {
      await connOrPool.query(sql);
    } catch (_) {
      // Ignore if column already exists or already modified
    }
  }

  examSchemaEnsured = true;
};

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
    let nextEcId = await getNextId(connection, 'enrolled_classes');
    for (const st of secStudents) {
      const targetStudentId = st.student_id || st.numeric_id;
      if (targetStudentId) {
        const [exists] = await connection.query(
          "SELECT id FROM enrolled_classes WHERE (student_id = ? OR student_id = ?) AND class_assignment_id = ? LIMIT 1",
          [st.student_id || '', st.numeric_id || 0, classId]
        );
        if (exists.length === 0) {
          try {
            await connection.query(
              "INSERT INTO enrolled_classes (id, student_id, class_assignment_id, status) VALUES (?, ?, ?, 'Enrolled')",
              [nextEcId++, String(targetStudentId), classId]
            );
          } catch (_) {}
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
  const effectiveTeacherId = teacher_id || req.user?.id || 1;

  if (!class_id || !title || !category) {
    return res.status(400).json({ status: "error", message: "Missing required fields." });
  }

  await ensureExamSchema(pool);

  const parsedQuarter = quarter ? parseInt(quarter, 10) : null;
  const parsedMaxScore = max_score ? parseFloat(max_score) : 100;
  const finalDueDate = due_date || null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get next activity ID manually (TiDB lacks AUTO_INCREMENT)
    const activityId = await getNextId(connection, 'activities');

    await connection.query(
      `INSERT INTO activities (id, class_id, quarter, teacher_id, title, description, category, max_score, due_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [activityId, class_id, parsedQuarter, effectiveTeacherId, title, description || null, category, parsedMaxScore, finalDueDate]
    );

    // 2. Fetch all enrolled students (syncing section enrollments automatically)
    const { students } = await getClassEnrolledStudents(connection, class_id);

    // 3. Assign to students with 'Pending' status
    if (students.length > 0) {
      let nextSasId = await getNextId(connection, 'student_activity_scores');
      for (const s of students) {
        const studentKey = s.string_id || s.ec_student_id;
        if (!studentKey) continue;
        try {
          await connection.query(
            "INSERT INTO student_activity_scores (id, activity_id, student_id, score, status) VALUES (?, ?, ?, 0, 'Pending')",
            [nextSasId++, activityId, String(studentKey)]
          );
        } catch (_) {}
      }
    }

    await connection.commit();
    await logAuditTrail(
      effectiveTeacherId,
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

// UPDATE EXISTING ACTIVITY
export const updateActivity = async (req, res) => {
  const { id, activity_id, class_id, title, category, description, max_score, due_date, quarter } = req.body;
  const targetId = activity_id || id;

  if (!targetId || !title || !category) {
    return res.status(400).json({ status: "error", message: "Activity ID, title, and category are required." });
  }

  await ensureExamSchema(pool);

  const parsedQuarter = quarter ? parseInt(quarter, 10) : null;
  const parsedMaxScore = max_score ? parseFloat(max_score) : 100;
  const finalDueDate = due_date || null;

  try {
    await pool.query(
      `UPDATE activities
       SET title = ?, description = ?, category = ?, quarter = ?, max_score = ?, due_date = ?
       WHERE id = ?`,
      [title, description || null, category, parsedQuarter, parsedMaxScore, finalDueDate, targetId]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Teacher',
      "UPDATE_ACTIVITY",
      `Updated activity #${targetId}: ${title} (Class ID: ${class_id || 'N/A'})`,
      req
    );

    return res.json({
      status: "success",
      message: "Activity updated successfully."
    });
  } catch (error) {
    console.error("Update activity error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// DELETE ACTIVITY (AND ASSOCIATED SCORES / QUESTIONS)
export const deleteActivity = async (req, res) => {
  const { id, activity_id, class_id } = req.body;
  const targetId = activity_id || id;

  if (!targetId) {
    return res.status(400).json({ status: "error", message: "Activity ID is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete exam choices & questions if any
    const [qRows] = await connection.query("SELECT id FROM exam_questions WHERE activity_id = ?", [targetId]);
    if (qRows.length > 0) {
      const qIds = qRows.map(q => q.id);
      await connection.query("DELETE FROM exam_choices WHERE question_id IN (?)", [qIds]);
      await connection.query("DELETE FROM exam_questions WHERE activity_id = ?", [targetId]);
    }

    // Delete student exam answers & activity scores
    try {
      await connection.query("DELETE FROM student_exam_answers WHERE activity_id = ?", [targetId]);
    } catch (_) {}
    await connection.query("DELETE FROM student_activity_scores WHERE activity_id = ?", [targetId]);

    // Delete main activity row
    await connection.query("DELETE FROM activities WHERE id = ?", [targetId]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Teacher',
      "DELETE_ACTIVITY",
      `Deleted activity #${targetId} from Class ID: ${class_id || 'N/A'}`,
      req
    );

    return res.json({
      status: "success",
      message: "Activity deleted successfully."
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete activity error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

// CREATE QUARTERLY EXAM / QUIZ (WITH MULTI-TYPE QUESTIONS & ANTI-CHEAT POLICY)
export const createExam = async (req, res) => {
  const { teacher_id, exam_details, questions } = req.body;
  const effectiveTeacherId = teacher_id || req.user?.id || 1;

  if (!exam_details || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ status: "error", message: "Missing required exam data." });
  }

  await ensureExamSchema(pool);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Calculate the total max_score based on the points of all questions
    let maxScore = 0;
    questions.forEach(q => {
      maxScore += parseFloat(q.points || 0);
    });

    const parsedQuarter = exam_details.quarter ? parseInt(exam_details.quarter, 10) : null;
    const toSqlDateTime = (v) => {
      if (!v) return null;
      const s = String(v).replace('T', ' ');
      return s.length === 16 ? `${s}:00` : s;
    };
    const finalDueDate = toSqlDateTime(exam_details.due_date);
    const finalOpenDate = toSqlDateTime(exam_details.open_date);
    const timeLimitMinutes = exam_details.time_limit_minutes ? parseInt(exam_details.time_limit_minutes, 10) : null;
    const maxAttempts = exam_details.max_attempts ? parseInt(exam_details.max_attempts, 10) : 1;
    const antiCheatJson = exam_details.anti_cheat
      ? JSON.stringify(exam_details.anti_cheat)
      : JSON.stringify({
          enabled: true,
          require_fullscreen: true,
          detect_tab_switch: true,
          max_warnings: 2,
          block_copy_paste: true,
          shuffle_questions: false
        });

    // 2. Get next activity ID manually (TiDB lacks AUTO_INCREMENT on activities.id)
    const activityId = await getNextId(connection, 'activities');

    try {
      await connection.query(
        `INSERT INTO activities (id, class_id, quarter, teacher_id, title, description, category, max_score, due_date, time_limit_minutes, max_attempts, anti_cheat_config) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          activityId,
          exam_details.class_id,
          parsedQuarter,
          effectiveTeacherId,
          exam_details.title,
          exam_details.description || null,
          exam_details.category || 'exam',
          maxScore,
          finalDueDate,
          timeLimitMinutes,
          maxAttempts,
          antiCheatJson
        ]
      );
    } catch (insertActErr) {
      // Fallback if anti_cheat_config column was not yet added
      await connection.query(
        `INSERT INTO activities (id, class_id, quarter, teacher_id, title, description, category, max_score, due_date, time_limit_minutes, max_attempts) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          activityId,
          exam_details.class_id,
          parsedQuarter,
          effectiveTeacherId,
          exam_details.title,
          exam_details.description || null,
          exam_details.category || 'exam',
          maxScore,
          finalDueDate,
          timeLimitMinutes,
          maxAttempts
        ]
      );
    }

    // 3. Loop through and Insert all Questions & Choices/Answer Keys with explicit IDs
    try {
      await connection.query("UPDATE activities SET open_date = ? WHERE id = ?", [finalOpenDate, activityId]);
    } catch (_) {}
    let nextQuestionId = await getNextId(connection, 'exam_questions');
    let nextChoiceId = await getNextId(connection, 'exam_choices');

    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      const qType = q.type || 'multiple_choice';
      const questionId = nextQuestionId++;

      await connection.query(
        "INSERT INTO exam_questions (id, activity_id, question_text, question_type, points, order_num) VALUES (?, ?, ?, ?, ?, ?)",
        [questionId, activityId, q.text, qType, parseFloat(q.points || 1), index + 1]
      );

      if (qType === 'multiple_choice' || qType === 'true_false') {
        const choicesList = Array.isArray(q.choices) && q.choices.length > 0
          ? q.choices
          : (qType === 'true_false' ? ['True', 'False'] : []);
        const correctIdx = parseInt(q.correctChoiceIndex ?? 0, 10);

        for (let cIndex = 0; cIndex < choicesList.length; cIndex++) {
          const choiceText = String(choicesList[cIndex] ?? '').trim() || `Option ${cIndex + 1}`;
          const isCorrect = cIndex === correctIdx ? 1 : 0;
          await connection.query(
            "INSERT INTO exam_choices (id, question_id, choice_text, is_correct) VALUES (?, ?, ?, ?)",
            [nextChoiceId++, questionId, choiceText, isCorrect]
          );
        }
      } else if (qType === 'checkboxes' && Array.isArray(q.choices)) {
        const correctIndices = Array.isArray(q.correctChoiceIndices)
          ? q.correctChoiceIndices.map(n => parseInt(n, 10))
          : [parseInt(q.correctChoiceIndex ?? 0, 10)];

        for (let cIndex = 0; cIndex < q.choices.length; cIndex++) {
          const choiceText = String(q.choices[cIndex] ?? '').trim() || `Option ${cIndex + 1}`;
          const isCorrect = correctIndices.includes(cIndex) ? 1 : 0;
          await connection.query(
            "INSERT INTO exam_choices (id, question_id, choice_text, is_correct) VALUES (?, ?, ?, ?)",
            [nextChoiceId++, questionId, choiceText, isCorrect]
          );
        }
      } else if (qType === 'identification' || qType === 'fill_blank') {
        // Store the acceptable answer(s) in exam_choices with is_correct = 1
        const rawAnswers = Array.isArray(q.choices) && q.choices.length > 0
          ? q.choices
          : (q.correctAnswer ? String(q.correctAnswer).split(',').map(s => s.trim()).filter(Boolean) : []);

        for (const ansText of rawAnswers) {
          if (String(ansText).trim()) {
            await connection.query(
              "INSERT INTO exam_choices (id, question_id, choice_text, is_correct) VALUES (?, ?, ?, 1)",
              [nextChoiceId++, questionId, String(ansText).trim()]
            );
          }
        }
      } else if (qType === 'enumeration') {
        const itemsList = Array.isArray(q.choices)
          ? q.choices.map(s => String(s).trim()).filter(Boolean)
          : [];
        for (const itemText of itemsList) {
          await connection.query(
            "INSERT INTO exam_choices (id, question_id, choice_text, is_correct) VALUES (?, ?, ?, 1)",
            [nextChoiceId++, questionId, itemText]
          );
        }
      }
    }

    // 4. Assign to Enrolled Students with explicit IDs
    const { students } = await getClassEnrolledStudents(connection, exam_details.class_id);

    if (students.length > 0) {
      let nextSasId = await getNextId(connection, 'student_activity_scores');
      for (const s of students) {
        const studentKey = s.string_id || s.ec_student_id;
        if (!studentKey) continue;
        try {
          await connection.query(
            "INSERT INTO student_activity_scores (id, activity_id, student_id, score, status) VALUES (?, ?, ?, 0, 'Pending')",
            [nextSasId++, activityId, String(studentKey)]
          );
        } catch (_) {}
      }
    }

    await connection.commit();
    await logAuditTrail(
      effectiveTeacherId,
      req.user?.role || 'Teacher',
      "CREATE_EXAMINATION",
      `Created exam: ${exam_details.title} (${questions.length} items, ${maxScore} pts) for Class ID: ${exam_details.class_id}`,
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
    await ensureExamSchema(pool);
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
    const nextAnnId = await getNextId(connection, 'class_announcements');
    await connection.query(
      `INSERT INTO class_announcements (id, class_id, teacher_id, title, message, type)
       VALUES (?, ?, ?, ?, ?, 'Task Reminder')`,
      [nextAnnId, class_id, teacherId, `New Activity: ${title}`, activityDesc]
    );

    // 2. Insert into notifications & notification_recipients with explicit IDs
    const notificationId = await getNextId(connection, 'notifications');
    await connection.query(
      `INSERT INTO notifications (id, sender_id, sender_role, type, title, message, created_at)
       VALUES (?, ?, 'teacher', 'Task Reminder', ?, ?, NOW())`,
      [notificationId, teacherId, `[${subjectLabel}] ${title}`, activityDesc]
    );

    const recipientSet = new Set();
    for (const s of students) {
      if (s.string_id) recipientSet.add(String(s.string_id));
      if (s.numeric_id) recipientSet.add(String(s.numeric_id));
    }

    let nextRecipId = await getNextId(connection, 'notification_recipients');
    if (recipientSet.size > 0) {
      for (const sid of recipientSet) {
        await connection.query(
          `INSERT INTO notification_recipients (id, notification_id, recipient_id, recipient_role, is_read) VALUES (?, ?, ?, 'student', 0)`,
          [nextRecipId++, notificationId, sid]
        );
      }
    } else {
      await connection.query(
        `INSERT INTO notification_recipients (id, notification_id, recipient_id, recipient_role, is_read) VALUES (?, ?, 'all', 'student', 0)`,
        [nextRecipId, notificationId]
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

// GET LEARNING MODULES / HANDOUTS / VIDEO LECTURES FOR A CLASS
export const getModules = async (req, res) => {
  const classId = req.query.class_id ? parseInt(req.query.class_id, 10) : null;
  if (!classId) {
    return res.status(400).json({ status: "error", message: "Class ID required." });
  }

  try {
    await ensureClassroomModulesTable();
    const [modules] = await pool.query(
      `SELECT id, class_id, teacher_id, title, description, module_type, COALESCE(file_url, file_path) as file_url, created_at
       FROM classroom_modules
       WHERE class_id = ?
       ORDER BY created_at DESC`,
      [classId]
    );

    return res.json({
      status: "success",
      data: modules
    });
  } catch (error) {
    console.error("Get modules error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// CREATE LEARNING MODULE / HANDOUT / VIDEO LECTURE
export const createModule = async (req, res) => {
  const { class_id, teacher_id, title, description, module_type, file_url } = req.body;

  if (!class_id || !title) {
    return res.status(400).json({ status: "error", message: "Class ID and module title are required." });
  }

  const normalizedType = module_type === 'video' ? 'video' : 'lecture';

  try {
    await ensureClassroomModulesTable();
    const nextModId = await getNextId(pool, 'classroom_modules');
    await pool.query(
      `INSERT INTO classroom_modules (id, class_id, teacher_id, title, description, module_type, file_url, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextModId, class_id, teacher_id || req.user?.id || 1, title, description || null, normalizedType, file_url || null, file_url || null]
    );

    return res.json({
      status: "success",
      message: "Learning module posted successfully.",
      data: { id: nextModId }
    });
  } catch (error) {
    console.error("Create module error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// DELETE LEARNING MODULE
export const deleteModule = async (req, res) => {
  const { id, module_id } = req.body;
  const targetId = module_id || id;

  if (!targetId) {
    return res.status(400).json({ status: "error", message: "Module ID required." });
  }

  try {
    await ensureClassroomModulesTable();
    await pool.query("DELETE FROM classroom_modules WHERE id = ?", [targetId]);
    return res.json({
      status: "success",
      message: "Learning module removed."
    });
  } catch (error) {
    console.error("Delete module error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default {
  getNextId,
  ensureExamSchema,
  createActivity,
  updateActivity,
  deleteActivity,
  createExam,
  getActivities,
  shareActivity,
  getModules,
  createModule,
  deleteModule
};
