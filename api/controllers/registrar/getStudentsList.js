import pool from '../../config/db.js';

const getStudentsList = async (req, res) => {
  try {
    const sql = `
      SELECT 
          s.*, 
          DATE_FORMAT(s.dob, '%Y-%m-%d') as dob,
          e.grade_level, 
          e.status as enrollment_status, 
          e.enrollment_type, 
          e.school_year, 
          e.prev_school, 
          p.program_code, 
          p.program_description, 
          p.major 
      FROM students s 
      LEFT JOIN enrollments e ON s.student_id = e.student_id 
      LEFT JOIN academic_programs p ON e.program_id = p.id 
      ORDER BY s.last_name ASC
    `;

    const [rows] = await pool.query(sql);

    const students = rows.map(row => {
      const cleanedRow = { ...row };
      // SECURITY: Burado ang password hash bago ipadala sa client side
      delete cleanedRow.password;

      // Fallback para sa mga bago pa lang na-profile
      if (!cleanedRow.grade_level) {
        cleanedRow.grade_level = 'Unassigned';
        cleanedRow.enrollment_status = 'New Profile';
      }

      return cleanedRow;
    });

    return res.json(students);

  } catch (error) {
    console.error("Get students list error:", error);
    return res.status(500).json({
      success: false,
      message: "Database Error: " + error.message
    });
  }
};

export default getStudentsList;
