import pool from '../../config/db.js';

export const getAcademicPrograms = async (req, res) => {
  try {
    const sql = `
      SELECT id, department, program_code, program_description, major, status, curriculum_year 
      FROM academic_programs 
      ORDER BY department DESC, program_code ASC
    `;
    const [programs] = await pool.query(sql);
    return res.status(200).json(programs || []);
  } catch (error) {
    console.error("getAcademicPrograms error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const addAcademicProgram = async (req, res) => {
  const { department, program_code, program_description, major = null, status = 'Active', curriculum_year = '2024-2025' } = req.body;

  if (!department || !program_code || !program_description) {
    return res.status(400).json({ success: false, message: "Incomplete data provided. Department, program code, and description are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Query for manually incremented id due to TiDB constraints
    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM academic_programs FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    const sql = `
      INSERT INTO academic_programs (id, department, program_code, program_description, major, status, curriculum_year) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(sql, [
      nextId,
      department.trim(),
      program_code.toUpperCase().trim(),
      program_description.trim(),
      major ? major.trim() : null,
      status.trim(),
      curriculum_year.trim()
    ]);

    await connection.commit();
    return res.status(201).json({ success: true, message: "Program successfully added." });
  } catch (error) {
    await connection.rollback();
    console.error("addAcademicProgram error:", error);
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(400).json({ success: false, message: "Error: Program Code already exists." });
    }
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const deleteAcademicProgram = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Program ID is missing." });
  }

  try {
    const sql = "DELETE FROM academic_programs WHERE id = ?";
    const [result] = await pool.query(sql, [parseInt(id, 10)]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ success: true, message: "Program deleted successfully." });
    } else {
      return res.status(400).json({ success: false, message: "Failed to delete program or program not found." });
    }
  } catch (error) {
    console.error("deleteAcademicProgram error:", error);
    // Integrity check
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: This program is currently linked to students or courses."
      });
    }
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};
