import pool from '../../config/db.js';

const getSubjects = async (req, res) => {
  try {
    // 1. KUNIN ANG MGA SUBJECTS (may kasamang academic program names)
    const sql_subjects = `
      SELECT 
          s.id, 
          s.subject_code, 
          s.subject_description, 
          s.units, 
          s.grade_level_applicable,
          s.level_category,
          s.program_id,
          s.curriculum_year,
          COALESCE(p.program_code, 'General') as program_code,
          COALESCE(p.curriculum_year, 'N/A') as program_curriculum_year
      FROM subjects s 
      LEFT JOIN academic_programs p ON s.program_id = p.id 
      ORDER BY s.id DESC
    `;
    const [subjects] = await pool.query(sql_subjects);

    // 2. KUNIN ANG MGA AKTIBONG PROGRAMS
    const sql_programs = `
      SELECT id, department, program_code 
      FROM academic_programs 
      WHERE status = 'Active' 
      ORDER BY department ASC
    `;
    const [programs] = await pool.query(sql_programs);

    return res.json({
      success: true,
      subjects: subjects || [],
      programs: programs || []
    });

  } catch (error) {
    console.error("Get subjects error:", error);
    return res.status(500).json({
      success: false,
      message: "Database Error: " + error.message
    });
  }
};

export default getSubjects;
