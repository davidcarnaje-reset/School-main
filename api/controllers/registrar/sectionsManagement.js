import pool from '../../config/db.js';

export const getSections = async (req, res) => {
  try {
    const sql_sections = `
      SELECT s.*, ap.program_code, ap.program_description, ap.major 
      FROM sections s 
      LEFT JOIN academic_programs ap ON s.program_id = ap.id 
      ORDER BY s.id DESC
    `;
    const [sections] = await pool.query(sql_sections);

    const sql_programs = `
      SELECT id, department, program_code, program_description, major 
      FROM academic_programs 
      WHERE status = 'Active'
    `;
    const [programs] = await pool.query(sql_programs);

    return res.status(200).json({
      status: "success",
      sections: sections || [],
      programs: programs || []
    });
  } catch (error) {
    console.error("getSections error:", error);
    return res.status(500).json({ status: "error", message: "DB Error: " + error.message });
  }
};

export const createSection = async (req, res) => {
  const { section_name, grade_level, department, program_id, max_capacity } = req.body;

  if (!section_name || !grade_level || !department) {
    return res.status(400).json({ status: "error", message: "Section Name, Grade Level and Department are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let finalProgramId = null;
    if (department !== 'K-10' && program_id && program_id !== '') {
      finalProgramId = parseInt(program_id, 10);
    }

    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM sections FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    const sql = `
      INSERT INTO sections (id, section_name, grade_level, department, program_id, max_capacity) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.query(sql, [
      nextId,
      section_name.trim(),
      grade_level.trim(),
      department.trim(),
      finalProgramId,
      parseInt(max_capacity, 10) || 40
    ]);

    await connection.commit();
    return res.status(201).json({ status: "success", message: "Section created!" });
  } catch (error) {
    await connection.rollback();
    console.error("createSection error:", error);
    return res.status(500).json({ status: "error", message: "DB Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const getSectionDetails = async (req, res) => {
  const { section_id } = req.query;

  if (!section_id) {
    return res.status(400).json({ success: false, message: "Section ID is required" });
  }

  try {
    const sql_students = `
      SELECT s.student_id, s.first_name, s.last_name, s.gender, e.status
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      WHERE e.section_id = ? AND e.status IN ('Assessed', 'Enrolled')
      ORDER BY s.last_name ASC
    `;
    const [students] = await pool.query(sql_students, [parseInt(section_id, 10)]);

    const sql_schedules = `
      SELECT 
        ca.schedule, ca.room_id, r.room_name, 
        u.first_name as prof_fname, u.last_name as prof_lname, 
        sub.subject_code, sub.subject_description
      FROM class_assignments ca
      LEFT JOIN rooms r ON ca.room_id = r.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN subjects sub ON ca.subject_id = sub.id
      WHERE ca.section_id = ? AND ca.is_active = 1
      ORDER BY ca.start_time ASC
    `;
    const [schedules] = await pool.query(sql_schedules, [parseInt(section_id, 10)]);

    return res.status(200).json({
      success: true,
      students: students || [],
      schedules: schedules || [],
      enrolled_count: (students || []).length
    });
  } catch (error) {
    console.error("getSectionDetails error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const getSectionsForEnrollment = async (req, res) => {
  const { grade_level, program_id } = req.query;

  if (!grade_level) {
    return res.status(400).json({ success: false, message: "Grade level is required." });
  }

  try {
    let sql = "";
    let params = [];

    if (grade_level.toLowerCase() === 'college') {
      sql = `
        SELECT id, section_name, max_capacity as capacity, grade_level 
        FROM sections 
        WHERE status = 'Active' 
        AND department = 'College'
      `;
      if (program_id && program_id !== 'null' && program_id !== 'undefined' && program_id !== '') {
        sql += " AND program_id = ?";
        params.push(parseInt(program_id, 10));
      }
      sql += " ORDER BY grade_level ASC, section_name ASC";
    } else {
      sql = `
        SELECT id, section_name, max_capacity as capacity, grade_level 
        FROM sections 
        WHERE status = 'Active' 
        AND grade_level = ?
      `;
      params.push(grade_level);

      if (program_id && program_id !== 'null' && program_id !== 'undefined' && program_id !== '') {
        sql += " AND program_id = ?";
        params.push(parseInt(program_id, 10));
      }
      sql += " ORDER BY section_name ASC";
    }

    const [sections] = await pool.query(sql, params);
    return res.status(200).json({ success: true, sections: sections || [] });
  } catch (error) {
    console.error("getSectionsForEnrollment error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const updateSection = async (req, res) => {
  const { id, section_name, grade_level, department, program_id, max_capacity } = req.body;

  if (!id || !section_name || !grade_level || !department) {
    return res.status(400).json({ status: "error", message: "Section ID, Name, Grade Level and Department are required." });
  }

  try {
    let finalProgramId = null;
    if (department !== 'K-10' && program_id && program_id !== '') {
      finalProgramId = parseInt(program_id, 10);
    }

    const sql = `
      UPDATE sections SET 
        section_name = ?, 
        grade_level = ?, 
        department = ?, 
        program_id = ?, 
        max_capacity = ? 
      WHERE id = ?
    `;
    await pool.query(sql, [
      section_name.trim(),
      grade_level.trim(),
      department.trim(),
      finalProgramId,
      parseInt(max_capacity, 10) || 40,
      parseInt(id, 10)
    ]);

    return res.status(200).json({ status: "success", message: "Section updated successfully!" });
  } catch (error) {
    console.error("updateSection error:", error);
    return res.status(500).json({ status: "error", message: "DB Error: " + error.message });
  }
};

export const deleteSection = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ status: "error", message: "Section ID is missing." });
  }

  try {
    const sql = "DELETE FROM sections WHERE id = ?";
    const [result] = await pool.query(sql, [parseInt(id, 10)]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ status: "success", message: "Section deleted successfully." });
    } else {
      return res.status(400).json({ status: "error", message: "Failed to delete section or section not found." });
    }
  } catch (error) {
    console.error("deleteSection error:", error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete: This section is currently linked to schedules or enrolled students."
      });
    }
    return res.status(500).json({ status: "error", message: "DB Error: " + error.message });
  }
};
