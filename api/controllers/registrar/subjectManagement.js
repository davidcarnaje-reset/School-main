import pool from '../../config/db.js';

export const getSubjectDetails = async (req, res) => {
  const { subject_id } = req.query;

  if (!subject_id) {
    return res.status(400).json({ success: false, message: "Subject ID is required." });
  }

  try {
    const sql = `
      SELECT 
        ca.id as class_id, 
        ca.schedule, 
        r.room_name as room,
        u.first_name, 
        u.last_name, 
        sec.section_name,
        sec.grade_level,
        (SELECT COUNT(id) FROM enrolled_classes ec WHERE ec.class_assignment_id = ca.id AND ec.status = 'Enrolled') as student_count
      FROM class_assignments ca
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.subject_id = ? AND ca.is_active = 1
      ORDER BY sec.grade_level ASC, sec.section_name ASC
    `;
    const [classes] = await pool.query(sql, [parseInt(subject_id, 10)]);
    return res.status(200).json({ success: true, classes: classes || [] });
  } catch (error) {
    console.error("getSubjectDetails error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const addSubject = async (req, res) => {
  const { 
    subject_code, 
    subject_description, 
    level_category, 
    subject_type = 'None',
    units = 0, 
    grade_level_applicable, 
    program_id = null, 
    semester = 'N/A',
    curriculum_year = '2024-2025'
  } = req.body;

  if (!subject_code || !subject_description || !level_category) {
    return res.status(400).json({ success: false, message: "Subject Code, Description, and Category are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM subjects FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    // Filter program_id and semester
    let finalProgramId = null;
    if (level_category !== 'K-10' && program_id && program_id !== 'GE' && program_id !== '') {
      finalProgramId = parseInt(program_id, 10);
    }
    const finalSemester = (level_category === 'K-10') ? 'N/A' : (semester || '1st');
    const finalSubjectType = (level_category === 'K-10') ? 'None' : (subject_type || 'None');

    const sql = `
      INSERT INTO subjects 
        (id, level_category, subject_type, subject_code, subject_description, units, grade_level_applicable, program_id, semester, curriculum_year) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(sql, [
      nextId,
      level_category,
      finalSubjectType,
      subject_code.toUpperCase().trim(),
      subject_description.trim(),
      parseInt(units, 10),
      grade_level_applicable,
      finalProgramId,
      finalSemester,
      curriculum_year.trim()
    ]);

    await connection.commit();
    return res.status(201).json({ success: true, message: "Subject successfully added to curriculum!" });
  } catch (error) {
    await connection.rollback();
    console.error("addSubject error:", error);
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(400).json({ success: false, message: "Error: Subject Code already exists." });
    }
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const deleteSubject = async (req, res) => {
  const { subject_id } = req.body;

  if (!subject_id) {
    return res.status(400).json({ success: false, message: "Subject ID is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Find all class assignments related to this subject
    const [classes] = await connection.query("SELECT id FROM class_assignments WHERE subject_id = ?", [parseInt(subject_id, 10)]);

    if (classes.length > 0) {
      const classIds = classes.map(c => c.id);
      // 2. Cascade delete enrolled classes for these assignments
      await connection.query("DELETE FROM enrolled_classes WHERE class_assignment_id IN (?)", [classIds]);
      // 3. Delete class assignments
      await connection.query("DELETE FROM class_assignments WHERE subject_id = ?", [parseInt(subject_id, 10)]);
    }

    // 4. Delete the subject itself
    await connection.query("DELETE FROM subjects WHERE id = ?", [parseInt(subject_id, 10)]);

    await connection.commit();
    return res.status(200).json({ success: true, message: "Subject and all connected records successfully deleted!" });
  } catch (error) {
    await connection.rollback();
    console.error("deleteSubject error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};
