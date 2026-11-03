import pool from '../../config/db.js';
import jwt from 'jsonwebtoken';

let schemaChecked = false;
const ensureGradingColumns = async () => {
  if (schemaChecked) return;
  try {
    const alterStatements = [
      "ALTER TABLE student_grades ADD COLUMN initial_grade DECIMAL(5,2) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN descriptive_grade VARCHAR(15) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN descriptor VARCHAR(60) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN details_json LONGTEXT NULL DEFAULT NULL"
    ];
    for (const stmt of alterStatements) {
      try {
        await pool.query(stmt);
      } catch (e) {
        // Ignore duplicate column error (ER_DUP_FIELDNAME = 1060)
      }
    }
    schemaChecked = true;
  } catch (err) {
    console.warn("ensureGradingColumns warning:", err.message);
  }
};

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
    await ensureGradingColumns();

    // Get class info including teacher and adviser info
    const [classRows] = await pool.query(
      `SELECT 
         ca.*,
         sub.subject_description,
         sub.subject_code,
         sub.level_category,
         sub.subject_type,
         sub.units,
         sec.section_name,
         sec.grade_level,
         sec.department,
         CONCAT_WS(' ', t.first_name, t.last_name) AS teacher_name,
         CONCAT_WS(' ', adv.first_name, adv.last_name) AS adviser_name
       FROM class_assignments ca
       JOIN subjects sub ON ca.subject_id = sub.id
       JOIN sections sec ON ca.section_id = sec.id
       LEFT JOIN users t ON ca.teacher_id = t.id
       LEFT JOIN users adv ON sec.adviser_id = adv.id
       WHERE ca.id = ?`,
      [classId]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Class not found" });
    }

    const classInfo = classRows[0];

    // Get enrolled students (union of section enrollments and enrolled_classes so no learner is missed)
    const studentsQuery = `
      SELECT DISTINCT
        s.student_id AS id,
        s.student_id AS student_id,
        s.student_id AS student_number,
        s.lrn,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.suffix,
        s.gender,
        s.dob,
        TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age,
        CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_name IS NOT NULL AND s.middle_name != '', CONCAT(' ', LEFT(s.middle_name, 1), '.'), '')) AS name,
        COALESCE(sg.written, 0) AS written,
        COALESCE(sg.performance, 0) AS performance,
        COALESCE(sg.exam, 0) AS exam,
        sg.initial_grade,
        COALESCE(sg.final_grade, 0) AS final_grade,
        sg.descriptive_grade,
        sg.descriptor,
        COALESCE(sg.remarks, '') AS remarks,
        sg.details_json
      FROM students s
      WHERE s.student_id IN (
        SELECT e.student_id FROM enrollments e WHERE e.section_id = ? AND e.status = 'Enrolled'
        UNION
        SELECT ec.student_id FROM enrolled_classes ec WHERE ec.class_assignment_id = ? AND ec.status = 'Enrolled'
        UNION
        SELECT sg2.student_id FROM student_grades sg2 WHERE sg2.class_id = ?
      )
      LEFT JOIN student_grades sg ON (
        s.student_id = sg.student_id 
        AND sg.class_id = ? 
        AND sg.quarter = ?
      )
      ORDER BY s.gender DESC, s.last_name ASC, s.first_name ASC
    `;

    let students = [];
    try {
      // Wait: in MySQL, LEFT JOIN must come BEFORE WHERE! Let's write the JOIN properly.
      const fixedStudentsQuery = `
        SELECT 
          s.student_id AS id,
          s.student_id AS student_id,
          s.student_id AS student_number,
          s.lrn,
          s.first_name,
          s.middle_name,
          s.last_name,
          s.suffix,
          s.gender,
          s.dob,
          TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age,
          CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_name IS NOT NULL AND s.middle_name != '', CONCAT(' ', LEFT(s.middle_name, 1), '.'), '')) AS name,
          COALESCE(sg.written, 0) AS written,
          COALESCE(sg.performance, 0) AS performance,
          COALESCE(sg.exam, 0) AS exam,
          sg.initial_grade,
          COALESCE(sg.final_grade, 0) AS final_grade,
          sg.descriptive_grade,
          sg.descriptor,
          COALESCE(sg.remarks, '') AS remarks,
          sg.details_json
        FROM (
          SELECT e.student_id FROM enrollments e WHERE e.section_id = ? AND e.status = 'Enrolled'
          UNION
          SELECT ec.student_id FROM enrolled_classes ec WHERE ec.class_assignment_id = ? AND ec.status = 'Enrolled'
          UNION
          SELECT sg2.student_id FROM student_grades sg2 WHERE sg2.class_id = ?
        ) enrolled_list
        JOIN students s ON enrolled_list.student_id = s.student_id
        LEFT JOIN student_grades sg ON (
          s.student_id = sg.student_id 
          AND sg.class_id = ? 
          AND sg.quarter = ?
        )
        ORDER BY s.gender DESC, s.last_name ASC, s.first_name ASC
      `;
      const [rows] = await pool.query(fixedStudentsQuery, [
        classInfo.section_id,
        classId,
        classId,
        classId,
        selectedQuarter
      ]);
      students = rows;
    } catch (innerErr) {
      console.error("Fallback student query:", innerErr.message);
      const [rows] = await pool.query(
        `SELECT 
          s.student_id AS id,
          s.student_id AS student_id,
          s.student_id AS student_number,
          s.lrn,
          s.first_name,
          s.middle_name,
          s.last_name,
          s.gender,
          s.dob,
          CONCAT(s.last_name, ', ', s.first_name) AS name,
          COALESCE(sg.written, 0) AS written,
          COALESCE(sg.performance, 0) AS performance,
          COALESCE(sg.exam, 0) AS exam,
          sg.initial_grade,
          COALESCE(sg.final_grade, 0) AS final_grade,
          sg.descriptive_grade,
          sg.descriptor,
          COALESCE(sg.remarks, '') AS remarks,
          sg.details_json
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        JOIN class_assignments ca ON e.section_id = ca.section_id
        LEFT JOIN student_grades sg ON (
          s.student_id = sg.student_id 
          AND sg.class_id = ca.id 
          AND sg.quarter = ?
        )
        WHERE ca.id = ? AND e.status = 'Enrolled'
        ORDER BY s.last_name ASC`,
        [selectedQuarter, classId]
      );
      students = rows;
    }

    // Also fetch all quarters/terms for this class to attach multi-term summary to each student
    const [allQuarterRows] = await pool.query(
      `SELECT student_id, quarter, written, performance, exam, initial_grade, final_grade, descriptive_grade, descriptor, remarks, details_json
       FROM student_grades
       WHERE class_id = ?`,
      [classId]
    );

    const byStudentQuarter = {};
    for (const r of allQuarterRows) {
      if (!byStudentQuarter[r.student_id]) byStudentQuarter[r.student_id] = {};
      byStudentQuarter[r.student_id][r.quarter || 1] = r;
    }

    students = students.map(st => ({
      ...st,
      all_terms: byStudentQuarter[st.student_id] || {}
    }));

    // Get lock status for all quarters
    const [lockRows] = await pool.query(
      "SELECT quarter, is_locked FROM class_grade_locks WHERE class_id = ?",
      [classId]
    );

    const locksByQuarter = {};
    for (const lr of lockRows) {
      locksByQuarter[lr.quarter || 1] = parseInt(lr.is_locked, 10) === 1;
    }

    const isLocked = !!locksByQuarter[selectedQuarter];
    classInfo.is_grades_submitted = isLocked;
    classInfo.locks_by_quarter = locksByQuarter;

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

// 2. GET QUARTERLY SUMMARY (Q1-Q4 / T1-T3 pivoted)
export const getQuarterlySummary = async (req, res) => {
  const classId = req.query.class_id ? parseInt(req.query.class_id, 10) : null;

  if (!classId) {
    return res.status(400).json({ status: "error", message: "Class ID is required." });
  }

  try {
    await ensureGradingColumns();

    const [classRows] = await pool.query("SELECT section_id FROM class_assignments WHERE id = ?", [classId]);
    const sectionId = classRows[0]?.section_id || 0;

    const query = `
      SELECT 
        s.student_id,
        s.student_id AS student_number,
        s.lrn,
        s.gender,
        CONCAT(s.last_name, ', ', s.first_name) AS name,
        MAX(CASE WHEN g.quarter = 1 THEN g.final_grade ELSE NULL END) AS q1,
        MAX(CASE WHEN g.quarter = 2 THEN g.final_grade ELSE NULL END) AS q2,
        MAX(CASE WHEN g.quarter = 3 THEN g.final_grade ELSE NULL END) AS q3,
        MAX(CASE WHEN g.quarter = 4 THEN g.final_grade ELSE NULL END) AS q4,
        MAX(CASE WHEN g.quarter = 1 THEN g.descriptive_grade ELSE NULL END) AS desc1,
        MAX(CASE WHEN g.quarter = 2 THEN g.descriptive_grade ELSE NULL END) AS desc2,
        MAX(CASE WHEN g.quarter = 3 THEN g.descriptive_grade ELSE NULL END) AS desc3,
        MAX(CASE WHEN g.quarter = 4 THEN g.descriptive_grade ELSE NULL END) AS desc4
      FROM (
        SELECT e.student_id FROM enrollments e WHERE e.section_id = ? AND e.status = 'Enrolled'
        UNION
        SELECT ec.student_id FROM enrolled_classes ec WHERE ec.class_assignment_id = ? AND ec.status = 'Enrolled'
        UNION
        SELECT sg2.student_id FROM student_grades sg2 WHERE sg2.class_id = ?
      ) enrolled_list
      JOIN students s ON enrolled_list.student_id = s.student_id
      LEFT JOIN student_grades g 
        ON s.student_id = g.student_id AND g.class_id = ? AND g.quarter IS NOT NULL
      GROUP BY s.student_id, s.lrn, s.gender, s.last_name, s.first_name
      ORDER BY s.gender DESC, s.last_name ASC
    `;

    const [rows] = await pool.query(query, [sectionId, classId, classId, classId]);

    const result = rows.map(row => {
      const q1 = row.q1 !== null && parseFloat(row.q1) > 0 ? parseFloat(row.q1) : null;
      const q2 = row.q2 !== null && parseFloat(row.q2) > 0 ? parseFloat(row.q2) : null;
      const q3 = row.q3 !== null && parseFloat(row.q3) > 0 ? parseFloat(row.q3) : null;
      const q4 = row.q4 !== null && parseFloat(row.q4) > 0 ? parseFloat(row.q4) : null;

      const graded = [q1, q2, q3, q4].filter(v => v !== null);
      const average = graded.length > 0
        ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length)
        : null;

      const finalGrade = average;
      const remarks = finalGrade !== null
        ? (finalGrade >= 75 ? 'Passed' : 'Failed')
        : 'Incomplete';

      return {
        student_id: row.student_id,
        student_number: row.student_number,
        lrn: row.lrn,
        gender: row.gender,
        name: row.name,
        q1,
        q2,
        q3,
        q4,
        desc1: row.desc1,
        desc2: row.desc2,
        desc3: row.desc3,
        desc4: row.desc4,
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

// 3. SAVE GRADES
export const saveGrades = async (req, res) => {
  const { class_id, quarter, period, students } = req.body;
  const classId = class_id ? parseInt(class_id, 10) : null;
  const selectedQuarter = period ?? quarter;

  if (!classId || selectedQuarter === null || !students || !Array.isArray(students)) {
    return res.status(400).json({ status: "error", message: "Class ID, quarter/period, and student data are required." });
  }

  await ensureGradingColumns();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (let s of students) {
      const studentId = s.student_id;
      const written = s.written ? parseFloat(s.written) : 0;
      const performance = s.performance ? parseFloat(s.performance) : 0;
      const exam = s.exam ? parseFloat(s.exam) : 0;
      const initialGrade = s.initial_grade !== undefined && s.initial_grade !== null ? parseFloat(s.initial_grade) : null;
      const finalGrade = s.final_grade ? parseFloat(s.final_grade) : 0;
      const descriptiveGrade = s.descriptive_grade || null;
      const descriptor = s.descriptor || null;
      const remarks = s.remarks || 'N/A';
      const detailsJson = s.details_json
        ? (typeof s.details_json === 'string' ? s.details_json : JSON.stringify(s.details_json))
        : null;

      const [exists] = await connection.query(
        "SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND quarter = ? LIMIT 1",
        [classId, studentId, selectedQuarter]
      );

      if (exists.length > 0) {
        await connection.query(
          `UPDATE student_grades 
           SET written = ?, performance = ?, exam = ?, initial_grade = ?, final_grade = ?, descriptive_grade = ?, descriptor = ?, remarks = ?, details_json = ?
           WHERE id = ?`,
          [written, performance, exam, initialGrade, finalGrade, descriptiveGrade, descriptor, remarks, detailsJson, exists[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO student_grades 
           (class_id, student_id, quarter, written, performance, exam, initial_grade, final_grade, descriptive_grade, descriptor, remarks, details_json) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [classId, studentId, selectedQuarter, written, performance, exam, initialGrade, finalGrade, descriptiveGrade, descriptor, remarks, detailsJson]
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

  await ensureGradingColumns();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the class for this quarter
    const [lockExists] = await connection.query(
      "SELECT id FROM class_grade_locks WHERE class_id = ? AND quarter = ? LIMIT 1",
      [classId, quarter]
    );
    if (lockExists.length > 0) {
      await connection.query("UPDATE class_grade_locks SET is_locked = 1 WHERE id = ?", [lockExists[0].id]);
    } else {
      await connection.query(
        "INSERT INTO class_grade_locks (class_id, quarter, is_locked) VALUES (?, ?, 1)",
        [classId, quarter]
      );
    }

    for (let s of students) {
      const studentId = s.student_id;
      const written = s.written ? parseFloat(s.written) : 0;
      const performance = s.performance ? parseFloat(s.performance) : 0;
      const exam = s.exam ? parseFloat(s.exam) : 0;
      const initialGrade = s.initial_grade !== undefined && s.initial_grade !== null ? parseFloat(s.initial_grade) : null;
      const finalGrade = s.final_grade ? parseFloat(s.final_grade) : 0;
      const descriptiveGrade = s.descriptive_grade || null;
      const descriptor = s.descriptor || null;
      const remarks = s.remarks || 'N/A';
      const detailsJson = s.details_json
        ? (typeof s.details_json === 'string' ? s.details_json : JSON.stringify(s.details_json))
        : null;

      // Save/update breakdown
      const [exists] = await connection.query(
        "SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND quarter = ? LIMIT 1",
        [classId, studentId, quarter]
      );

      if (exists.length > 0) {
        await connection.query(
          `UPDATE student_grades 
           SET written = ?, performance = ?, exam = ?, initial_grade = ?, final_grade = ?, descriptive_grade = ?, descriptor = ?, remarks = ?, details_json = ?
           WHERE id = ?`,
          [written, performance, exam, initialGrade, finalGrade, descriptiveGrade, descriptor, remarks, detailsJson, exists[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO student_grades 
           (class_id, student_id, quarter, written, performance, exam, initial_grade, final_grade, descriptive_grade, descriptor, remarks, details_json) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [classId, studentId, quarter, written, performance, exam, initialGrade, finalGrade, descriptiveGrade, descriptor, remarks, detailsJson]
        );
      }

      // Save official final grade (wrapped in try-catch in case student_final_grades table doesn't exist in some environments)
      try {
        await connection.query(
          `INSERT INTO student_final_grades (class_id, student_id, quarter, final_grade, remarks) 
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE final_grade = ?, remarks = ?`,
          [classId, studentId, quarter, finalGrade, remarks, finalGrade, remarks]
        );
      } catch (sfgErr) {
        // Ignore if student_final_grades is not present
      }
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
    const [classRows] = await connection.query("SELECT section_id FROM class_assignments WHERE id = ?", [classId]);
    const sectionId = classRows[0]?.section_id || 0;

    // 1. Get enrolled students
    const [students] = await connection.query(
      `SELECT e.student_id FROM enrollments e WHERE e.section_id = ? AND e.status = 'Enrolled'
       UNION
       SELECT ec.student_id FROM enrolled_classes ec WHERE ec.class_assignment_id = ? AND ec.status = 'Enrolled'`,
      [sectionId, classId]
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
        : null;

      // Calculate Performance Task
      const [perfRes] = await connection.query(
        `SELECT SUM(sas.score) as earned, SUM(a.max_score) as total 
         FROM activities a
         LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ?
         WHERE a.class_id = ? 
           AND a.category = 'performance'
           AND a.quarter = ?`,
        [studentId, classId, selectedQuarter]
      );

      const pf = perfRes[0];
      const perfGrade = (pf && pf.total > 0)
        ? Math.round((parseFloat(pf.earned || 0) / parseFloat(pf.total)) * 10000) / 100
        : null;

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
        : null;

      const [exists] = await connection.query(
        "SELECT id, written, performance, exam FROM student_grades WHERE class_id = ? AND student_id = ? AND quarter = ? LIMIT 1",
        [classId, studentId, selectedQuarter]
      );

      if (exists.length > 0) {
        const cur = exists[0];
        await connection.query(
          "UPDATE student_grades SET written = ?, performance = ?, exam = ? WHERE id = ?",
          [
            writtenGrade !== null ? writtenGrade : cur.written,
            perfGrade !== null ? perfGrade : cur.performance,
            examGrade !== null ? examGrade : cur.exam,
            cur.id
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO student_grades 
           (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, 0, 'N/A')`,
          [classId, studentId, selectedQuarter, writtenGrade || 0, perfGrade || 0, examGrade || 0]
        );
      }
    }

    await connection.commit();
    return res.json({ status: "success", message: "Grades synced from portal activities!" });

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

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: "error", message: "Unauthorized access. Token missing." });
  }

  const token = authHeader.split(' ')[1];
  let teacherId = 36;

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
    const quarterText = quarter ? ` (Term/Quarter ${quarter})` : "";

    const title = "Grade Unlock Request";
    const message = `A teacher is requesting permission to edit the locked grades for ${subjectName} - ${sectionName}${quarterText}. Please review and unlock via Registrar Student Academic Records.`;

    const [notifResult] = await connection.query(
      "INSERT INTO notifications (sender_id, sender_role, type, title, message, created_at) VALUES (?, 'teacher', 'Task Reminder', ?, ?, NOW())",
      [teacherId, title, message]
    );

    const notifId = notifResult.insertId;

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
