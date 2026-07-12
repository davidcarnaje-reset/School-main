import pool from '../../config/db.js';
import jwt from 'jsonwebtoken';

// 1. GET CLASS GRADES
export const getClassGrades = async (req, res) => {
  const classId = req.query.class_id ? parseInt(req.query.class_id, 10) : null;
  const quarter = req.query.quarter ? parseInt(req.query.quarter, 10) : null;
  const period = req.query.period ? parseInt(req.query.period, 10) : null;

  const selectedQuarter = period ?? quarter ?? 1;

  if (!classId) {
    return res.status(400).json({ status: "error", message: "Class ID required" });
  }

  try {
    // Get class info
    const [classRows] = await pool.query(
      `SELECT 
         ca.*,
         sub.subject_description,
         sub.subject_code,
         sub.level_category,
         sec.section_name,
         sec.grade_level,
         sec.department
       FROM class_assignments ca
       JOIN subjects sub ON ca.subject_id = sub.id
       JOIN sections sec ON ca.section_id = sec.id
       WHERE ca.id = ?`,
      [classId]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Class not found" });
    }

    const classInfo = classRows[0];

    // Get students with grades for this quarter
    const query = `
      SELECT 
        s.student_id as id,
        s.student_id as student_number,
        CONCAT(s.last_name, ', ', s.first_name) as name,
        COALESCE(sg.written, 0) as written,
        COALESCE(sg.performance, 0) as performance,
        COALESCE(sg.exam, 0) as exam,
        COALESCE(sg.final_grade, 0) as final_grade,
        COALESCE(sg.remarks, '') as remarks
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN class_assignments ca ON e.section_id = ca.section_id
      LEFT JOIN student_grades sg ON (
        s.student_id = sg.student_id 
        AND sg.class_id = ca.id 
        AND sg.quarter = ?
      )
      WHERE ca.id = ? AND e.status = 'Enrolled'
      ORDER BY s.last_name ASC
    `;

    const [students] = await pool.query(query, [selectedQuarter, classId]);

    // Get lock status
    const [lockRows] = await pool.query(
      "SELECT is_locked FROM class_grade_locks WHERE class_id = ? AND quarter = ?",
      [classId, selectedQuarter]
    );

    const isLocked = lockRows.length > 0 ? (parseInt(lockRows[0].is_locked, 10) === 1) : false;
    classInfo.is_grades_submitted = isLocked;

    return res.json({
      status: "success",
      class_info: classInfo,
      data: students
    });

  } catch (error) {
    console.error("Get class grades error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 2. GET QUARTERLY SUMMARY (Q1-Q4 pivoted)
export const getQuarterlySummary = async (req, res) => {
  const classId = req.query.class_id ? parseInt(req.query.class_id, 10) : null;

  if (!classId) {
    return res.status(400).json({ status: "error", message: "Class ID is required." });
  }

  try {
    const query = `
      SELECT 
        s.student_id,
        s.student_id                                                    AS student_number,
        CONCAT(s.last_name, ', ', s.first_name)                         AS name,
        MAX(CASE WHEN g.quarter = 1 THEN g.final_grade ELSE NULL END)   AS q1,
        MAX(CASE WHEN g.quarter = 2 THEN g.final_grade ELSE NULL END)   AS q2,
        MAX(CASE WHEN g.quarter = 3 THEN g.final_grade ELSE NULL END)   AS q3,
        MAX(CASE WHEN g.quarter = 4 THEN g.final_grade ELSE NULL END)   AS q4
      FROM class_assignments ca
      JOIN enrolled_classes ec 
        ON ca.id = ec.class_assignment_id AND ec.status = 'Enrolled'
      JOIN students s 
        ON ec.student_id = s.student_id
      LEFT JOIN student_grades g 
        ON s.student_id = g.student_id AND g.class_id = ca.id AND g.quarter IS NOT NULL
      WHERE ca.id = ?
      GROUP BY s.student_id, s.last_name, s.first_name
      ORDER BY s.last_name ASC
    `;

    const [rows] = await pool.query(query, [classId]);

    const result = rows.map(row => {
      const q1 = row.q1 !== null ? parseFloat(row.q1) : null;
      const q2 = row.q2 !== null ? parseFloat(row.q2) : null;
      const q3 = row.q3 !== null ? parseFloat(row.q3) : null;
      const q4 = row.q4 !== null ? parseFloat(row.q4) : null;

      const graded = [q1, q2, q3, q4].filter(v => v !== null);
      const average = graded.length > 0
        ? Math.round((graded.reduce((a, b) => a + b, 0) / graded.length) * 100) / 100
        : null;

      const allComplete = q1 !== null && q2 !== null && q3 !== null && q4 !== null;
      const finalGrade = allComplete ? average : null;
      const remarks = finalGrade !== null
        ? (finalGrade >= 75 ? 'Passed' : 'Failed')
        : 'Incomplete';

      return {
        student_id: row.student_id,
        student_number: row.student_number,
        name: row.name,
        q1,
        q2,
        q3,
        q4,
        final_grade: finalGrade,
        remarks
      };
    });

    return res.json({
      status: "success",
      data: result
    });

  } catch (error) {
    console.error("Get quarterly summary error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// 3. SAVE GRADES (manual backup)
export const saveGrades = async (req, res) => {
  const { class_id, quarter, period, students } = req.body;
  const classId = class_id ? parseInt(class_id, 10) : null;
  const selectedQuarter = period ?? quarter;

  if (!classId || selectedQuarter === null || !students || !Array.isArray(students)) {
    return res.status(400).json({ status: "error", message: "Class ID, quarter/period, and student data are required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (let s of students) {
      const studentId = s.student_id;
      const written = s.written ? parseFloat(s.written) : 0;
      const performance = s.performance ? parseFloat(s.performance) : 0;
      const exam = s.exam ? parseFloat(s.exam) : 0;
      const finalGrade = s.final_grade ? parseFloat(s.final_grade) : 0;
      const remarks = s.remarks || 'N/A';

      const [exists] = await connection.query(
        "SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND quarter = ? LIMIT 1",
        [classId, studentId, selectedQuarter]
      );

      if (exists.length > 0) {
        await connection.query(
          `UPDATE student_grades 
           SET written = ?, performance = ?, exam = ?, final_grade = ?, remarks = ?
           WHERE id = ?`,
          [written, performance, exam, finalGrade, remarks, exists[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO student_grades 
           (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [classId, studentId, selectedQuarter, written, performance, exam, finalGrade, remarks]
        );
      }
    }

    await connection.commit();
    return res.json({ status: "success", message: "Grades successfully saved!" });

  } catch (error) {
    await connection.rollback();
    console.error("Save grades error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

// 4. SUBMIT FINAL GRADES (and LOCK edits)
export const submitFinalGrades = async (req, res) => {
  const { class_id, quarter, students } = req.body;
  const classId = class_id ? parseInt(class_id, 10) : null;

  if (!classId || quarter === null || !students || !Array.isArray(students)) {
    return res.status(400).json({ status: "error", message: "Class ID, quarter, and students data are required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the class for this quarter
    await connection.query(
      `INSERT INTO class_grade_locks (class_id, quarter, is_locked) 
       VALUES (?, ?, 1) 
       ON DUPLICATE KEY UPDATE is_locked = 1`,
      [classId, quarter]
    );

    for (let s of students) {
      const studentId = s.student_id;
      const written = s.written ? parseFloat(s.written) : 0;
      const performance = s.performance ? parseFloat(s.performance) : 0;
      const exam = s.exam ? parseFloat(s.exam) : 0;
      const finalGrade = s.final_grade ? parseFloat(s.final_grade) : 0;
      const remarks = s.remarks || 'N/A';

      // Save/update breakdown
      const [exists] = await connection.query(
        "SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND quarter = ? LIMIT 1",
        [classId, studentId, quarter]
      );

      if (exists.length > 0) {
        await connection.query(
          `UPDATE student_grades 
           SET written = ?, performance = ?, exam = ?, final_grade = ?, remarks = ?
           WHERE id = ?`,
          [written, performance, exam, finalGrade, remarks, exists[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO student_grades 
           (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [classId, studentId, quarter, written, performance, exam, finalGrade, remarks]
        );
      }

      // Save official final grade
      await connection.query(
        `INSERT INTO student_final_grades (class_id, student_id, quarter, final_grade, remarks) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE final_grade = ?, remarks = ?`,
        [classId, studentId, quarter, finalGrade, remarks, finalGrade, remarks]
      );
    }

    await connection.commit();
    return res.json({ status: "success", message: "Final grades submitted and locked!" });

  } catch (error) {
    await connection.rollback();
    console.error("Submit final grades error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

// 5. SYNC GRADES FROM PORTAL ACTIVITIES
export const syncGrades = async (req, res) => {
  const { class_id, quarter, period } = req.body;
  const classId = class_id ? parseInt(class_id, 10) : null;
  const selectedQuarter = period ?? quarter;

  if (!classId || selectedQuarter === null) {
    return res.status(400).json({ status: "error", message: "Class ID and quarter/period are required." });
  }

  const connection = await pool.getConnection();

  try {
    // 1. Get enrolled students
    const [students] = await connection.query(
      `SELECT e.student_id 
       FROM enrollments e
       JOIN class_assignments ca ON e.section_id = ca.section_id
       WHERE ca.id = ? AND e.status = 'Enrolled'`,
      [classId]
    );

    if (students.length === 0) {
      return res.json({ status: "success", message: "No students found." });
    }

    await connection.beginTransaction();

    for (let s of students) {
      const studentId = s.student_id;

      // Calculate Written Work
      const [writtenRes] = await connection.query(
        `SELECT SUM(sas.score) as earned, SUM(a.max_score) as total 
         FROM activities a
         LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ?
         WHERE a.class_id = ? 
           AND a.category IN ('written', 'quiz', 'assignment', 'task')
           AND a.quarter = ?`,
        [studentId, classId, selectedQuarter]
      );

      const wr = writtenRes[0];
      const writtenGrade = (wr && wr.total > 0)
        ? Math.round((parseFloat(wr.earned || 0) / parseFloat(wr.total)) * 10000) / 100
        : 0;

      // Calculate Exam Work
      const [examRes] = await connection.query(
        `SELECT SUM(sas.score) as earned, SUM(a.max_score) as total 
         FROM activities a
         LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ?
         WHERE a.class_id = ? 
           AND a.category IN ('exam', 'quarterly_exam', 'prelim', 'midterm', 'finals')
           AND a.quarter = ?`,
        [studentId, classId, selectedQuarter]
      );

      const ex = examRes[0];
      const examGrade = (ex && ex.total > 0)
        ? Math.round((parseFloat(ex.earned || 0) / parseFloat(ex.total)) * 10000) / 100
        : 0;

      // Check if student grade already exists
      const [exists] = await connection.query(
        "SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND quarter = ? LIMIT 1",
        [classId, studentId, selectedQuarter]
      );

      if (exists.length > 0) {
        await connection.query(
          "UPDATE student_grades SET written = ?, exam = ? WHERE id = ?",
          [writtenGrade, examGrade, exists[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO student_grades 
           (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
           VALUES (?, ?, ?, ?, 0, ?, 0, 'N/A')`,
          [classId, studentId, selectedQuarter, writtenGrade, examGrade]
        );
      }
    }

    await connection.commit();
    return res.json({ status: "success", message: "Written Work and Exam grades synced from activities!" });

  } catch (error) {
    await connection.rollback();
    console.error("Sync grades error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

// 6. REQUEST GRADE UNLOCK
export const requestGradeUnlock = async (req, res) => {
  const { class_id, quarter } = req.body;
  const classId = class_id ? parseInt(class_id, 10) : null;

  if (!classId) {
    return res.status(400).json({ status: "error", message: "Class ID is required." });
  }

  // Token identification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: "error", message: "Unauthorized access. Token missing." });
  }

  const token = authHeader.split(' ')[1];
  let teacherId = 36; // Fallback static check

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sms_super_secret_key_2026');
    const [userRows] = await pool.query("SELECT id FROM users WHERE username = ?", [decoded.username]);
    if (userRows.length > 0) {
      teacherId = userRows[0].id;
    }
  } catch (jwtErr) {
    console.warn("JWT Verification failed in requestGradeUnlock:", jwtErr.message);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch class + section descriptors
    const [classDetails] = await connection.query(
      `SELECT sub.subject_code, sub.subject_description, sec.section_name 
       FROM class_assignments ca
       JOIN subjects sub ON ca.subject_id = sub.id
       JOIN sections sec ON ca.section_id = sec.id
       WHERE ca.id = ?`,
      [classId]
    );

    const detail = classDetails[0];
    const subjectName = detail ? detail.subject_description : 'Unknown Subject';
    const sectionName = detail ? detail.section_name : 'Unknown Section';
    const quarterText = quarter ? ` (Quarter ${quarter})` : "";

    const title = "Grade Unlock Request";
    const message = `A teacher is requesting permission to edit the locked grades for ${subjectName} - ${sectionName}${quarterText}. Please review and unlock via Class Management if approved.`;

    // 1. Insert notification record
    const [notifResult] = await connection.query(
      "INSERT INTO notifications (sender_id, sender_role, type, title, message, created_at) VALUES (?, 'teacher', 'Task Reminder', ?, ?, NOW())",
      [teacherId, title, message]
    );

    const notifId = notifResult.insertId;

    // 2. Query all active registrars
    const [registrars] = await connection.query(
      "SELECT id FROM users WHERE role = 'registrar' AND status = 'Active'"
    );

    if (registrars.length > 0) {
      for (let reg of registrars) {
        await connection.query(
          "INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role, is_read) VALUES (?, ?, 'registrar', 0)",
          [notifId, reg.id]
        );
      }
    }

    await connection.commit();
    return res.json({ status: "success", message: "Unlock request sent to the registrar." });

  } catch (error) {
    await connection.rollback();
    console.error("Request unlock error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export default { getClassGrades, getQuarterlySummary, saveGrades, submitFinalGrades, syncGrades, requestGradeUnlock };
