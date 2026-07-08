import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const getStudentRecords = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    // 1. Get Student Details
    const sql_student = `
      SELECT s.student_id, CONCAT(s.first_name, ' ', COALESCE(s.middle_name,''), ' ', s.last_name) AS name,
             e.grade_level, e.semester, COALESCE(ap.program_code, 'K-12 Basic Ed') AS program,
             CASE
                WHEN e.grade_level LIKE '%College%' THEN 'College'
                WHEN e.grade_level LIKE '%11%' OR e.grade_level LIKE '%12%' THEN 'SHS'
                ELSE 'K-10'
             END AS department
      FROM students s
      LEFT JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ? ORDER BY e.created_at DESC LIMIT 1
    `;
    const [studentRows] = await pool.query(sql_student, [student_id]);

    if (studentRows.length === 0) {
      return res.status(200).json({ success: false, message: "Student not found in the database." });
    }

    const student = studentRows[0];

    // 2. Get Grades and Lock Status
    const sql_grades = `
      SELECT 
          sg.class_id, 
          sg.quarter, 
          sg.final_grade, 
          sg.remarks,
          sub.subject_code AS code, 
          sub.subject_description AS description, 
          sub.units,
          COALESCE(MAX(cgl.is_locked), 0) AS is_locked
      FROM student_grades sg
      JOIN class_assignments ca ON sg.class_id = ca.id
      JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN class_grade_locks cgl 
          ON sg.class_id = cgl.class_id 
          AND (sg.quarter = cgl.quarter OR (sg.quarter IS NULL AND cgl.quarter IS NULL))
      WHERE sg.student_id = ?
      GROUP BY sg.class_id, sg.quarter, sg.final_grade, sg.remarks, sub.subject_code, sub.subject_description, sub.units
    `;
    const [grades] = await pool.query(sql_grades, [student_id]);

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

    // Audit Log trail logger
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
