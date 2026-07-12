import pool from '../../config/db.js';

// GET ACTIVE ACADEMIC PROGRAMS
export const getAcademicPrograms = async (req, res) => {
  try {
    const query = `
      SELECT id, department as dept, program_code as code, program_description as \`desc\`, major 
      FROM academic_programs 
      WHERE status = 'Active' 
      ORDER BY department DESC, program_code ASC
    `;
    const [programs] = await pool.query(query);
    return res.json(programs);
  } catch (error) {
    console.error("Get academic programs error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default { getAcademicPrograms };
