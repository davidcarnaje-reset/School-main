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
          s.subject_type,
          s.program_id,
          s.curriculum_year,
          COALESCE(s.minutes_per_session, 60) as minutes_per_session,
          COALESCE(s.frequency_per_week, 5) as frequency_per_week,
          COALESCE(s.lec_units, s.units, 0) as lec_units,
          COALESCE(s.lab_units, 0) as lab_units,
          s.lab_type,
          s.day_pattern,
          COALESCE(p.program_code, 'General') as program_code,
          COALESCE(p.program_description, '') as program_description,
          p.major as program_major,
          COALESCE(p.curriculum_year, 'N/A') as program_curriculum_year
      FROM subjects s 
      LEFT JOIN academic_programs p ON s.program_id = p.id 
      ORDER BY s.id DESC
    `;
    const [subjects] = await pool.query(sql_subjects);

    // 2. KUNIN ANG MGA AKTIBONG PROGRAMS WITH CURRICULUM YEAR
    const sql_programs = `
      SELECT id, department, program_code, program_description, major, status, curriculum_year 
      FROM academic_programs 
      WHERE status = 'Active' 
      ORDER BY department ASC, program_code ASC, curriculum_year DESC
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
