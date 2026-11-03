import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const getStudentRecords = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID, LRN, or Name is required." });
  }

  try {
    // Ensure new grading columns exist
    const alterStatements = [
      "ALTER TABLE student_grades ADD COLUMN initial_grade DECIMAL(5,2) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN descriptive_grade VARCHAR(15) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN descriptor VARCHAR(60) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN details_json LONGTEXT NULL DEFAULT NULL"
    ];
    for (const stmt of alterStatements) {
      try { await pool.query(stmt); } catch (e) {}
    }

    const q = String(student_id).trim();

    // 1. Get Student Details (support searching by student_id, lrn, or name)
    const sql_student = `
      SELECT 
        s.student_id, 
        s.lrn,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.suffix,
        s.gender,
        s.dob,
        TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age,
        CONCAT_WS(' ', s.first_name, COALESCE(s.middle_name,''), s.last_name, COALESCE(s.suffix,'')) AS name,
        CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_name IS NOT NULL AND s.middle_name != '', CONCAT(' ', LEFT(s.middle_name, 1), '.'), '')) AS formal_name,
        COALESCE(e.grade_level, sec.grade_level, 'Grade 1') AS grade_level, 
        e.semester, 
        COALESCE(e.school_year, '2026-2027') AS school_year,
        COALESCE(sec.section_name, e.section, 'Section A') AS section_name,
        e.section_id,
        CONCAT_WS(' ', adv.first_name, adv.last_name) AS adviser_name,
        COALESCE(ap.program_code, 'K-12 Basic Ed') AS program,
        COALESCE(ap.program_description, 'Basic Education Curriculum') AS program_description,
        CASE
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%College%' OR COALESCE(e.grade_level, '') LIKE '%Year%' THEN 'College'
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%11%' OR COALESCE(e.grade_level, sec.grade_level, '') LIKE '%12%' THEN 'SHS'
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%Kinder%' THEN 'Kinder'
          ELSE 'K-10'
        END AS department
      FROM students s
      LEFT JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN users adv ON sec.adviser_id = adv.id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ? 
         OR s.lrn = ? 
         OR CONCAT_WS(' ', s.first_name, s.last_name) LIKE ?
         OR CONCAT_WS(', ', s.last_name, s.first_name) LIKE ?
      ORDER BY e.created_at DESC LIMIT 1
    `;
    const likeQ = `%${q}%`;
    const [studentRows] = await pool.query(sql_student, [q, q, likeQ, likeQ]);

    if (studentRows.length === 0) {
      return res.status(200).json({ success: false, message: "Student not found in the database." });
    }

    const student = studentRows[0];
    const resolvedStudentId = student.student_id;

    // 2. Get Grades and Lock Status (including all subjects assigned to the student's section or enrolled_classes)
    const sql_grades = `
      SELECT 
          ca.id AS class_id, 
          sg.quarter, 
          sg.written,
          sg.performance,
          sg.exam,
          sg.initial_grade,
          sg.final_grade, 
          sg.descriptive_grade,
          sg.descriptor,
          sg.remarks,
          sg.details_json,
          sub.subject_code AS code, 
          sub.subject_description AS description, 
          sub.units,
          sub.subject_type,
          sub.level_category,
          CONCAT_WS(' ', t.first_name, t.last_name) AS teacher_name,
          COALESCE(cgl.is_locked, 0) AS is_locked
      FROM class_assignments ca
      JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN users t ON ca.teacher_id = t.id
      LEFT JOIN student_grades sg ON sg.class_id = ca.id AND sg.student_id = ?
      LEFT JOIN class_grade_locks cgl 
          ON ca.id = cgl.class_id 
          AND (sg.quarter = cgl.quarter OR (sg.quarter IS NULL AND cgl.quarter IS NULL))
      WHERE ca.section_id = ?
         OR ca.id IN (SELECT ec.class_assignment_id FROM enrolled_classes ec WHERE ec.student_id = ?)
         OR ca.id IN (SELECT sg2.class_id FROM student_grades sg2 WHERE sg2.student_id = ?)
      ORDER BY sub.subject_code ASC, sg.quarter ASC
    `;
    const [grades] = await pool.query(sql_grades, [
      resolvedStudentId,
      student.section_id || 0,
      resolvedStudentId,
      resolvedStudentId
    ]);

    return res.status(200).json({
      success: true,
      student,
      grades: grades || []
    });
  } catch (error) {
    console.error("getStudentRecords error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDocuments = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(200).json([]);
  }

  try {
    const sql = `
      SELECT id, document_name, file_path, status, date_uploaded 
      FROM student_documents 
      WHERE student_id = ?
    `;
    const [documents] = await pool.query(sql, [student_id]);
    return res.status(200).json(documents || []);
  } catch (error) {
    console.error("getStudentDocuments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const unlockGrades = async (req, res) => {
  const { class_id, quarter } = req.body;

  if (!class_id) {
    return res.status(400).json({ success: false, message: "Class ID is required." });
  }

  const finalQuarter = (quarter !== undefined && quarter !== "") ? quarter : null;

  try {
    let sql = "";
    let params = [];

    if (finalQuarter === null) {
      sql = "UPDATE class_grade_locks SET is_locked = 0 WHERE class_id = ? AND quarter IS NULL";
      params = [parseInt(class_id, 10)];
    } else {
      sql = "UPDATE class_grade_locks SET is_locked = 0 WHERE class_id = ? AND quarter = ?";
      params = [parseInt(class_id, 10), finalQuarter];
    }

    await pool.query(sql, params);

    await logAuditTrail(
      req.user?.id || 1, 
      req.user?.role || 'Admin', 
      "UNLOCK_GRADES", 
      `Unlocked grades for Class ID: ${class_id}`, 
      req
    );

    return res.status(200).json({
      success: true,
      message: "Grades unlocked! The teacher can now edit the grades for this subject."
    });
  } catch (error) {
    console.error("unlockGrades error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
