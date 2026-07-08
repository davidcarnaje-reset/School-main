import pool from '../../config/db.js';

export const getStudentsByStatus = async (req, res) => {
  const { status } = req.query;
  const targetStatus = status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Pending';

  try {
    const sql = `
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        e.grade_level,
        e.program_id,
        ap.program_code,
        e.status as enrollment_status,
        s.first_name,
        s.last_name,
        s.profile_image,
        ap.program_description
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE e.status = ?
      ORDER BY e.created_at DESC
    `;
    const [data] = await pool.query(sql, [targetStatus]);

    // Format profile_image path if it's relative
    const formattedData = (data || []).map(student => {
      if (student.profile_image && !student.profile_image.startsWith('http://') && !student.profile_image.startsWith('https://')) {
        student.profile_image = `http://localhost/sms-api/uploads/profiles/${student.profile_image}`;
      }
      return student;
    });

    return res.status(200).json(formattedData || []);
  } catch (error) {
    console.error("getStudentsByStatus error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getAvailableClasses = async (req, res) => {
  const { program_id, grade_level } = req.query;
  const targetGradeLevel = grade_level || '';

  try {
    let sql = `
      SELECT 
        ca.id as class_assignment_id, 
        ca.schedule, 
        r.room_name as room,
        s.subject_code, 
        s.subject_description, 
        s.units, 
        u.first_name, 
        u.last_name, 
        sec.section_name,
        sec.grade_level
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.is_active = 1
    `;
    const params = [];

    // Filter by grade levels (College vs SHS vs K-10)
    if (targetGradeLevel.toLowerCase().includes('college') || targetGradeLevel.toLowerCase().includes('year')) {
      sql += " AND s.level_category = 'College'";
      if (program_id && program_id !== 'null' && program_id !== 'undefined' && program_id !== '') {
        sql += " AND (s.program_id = ? OR s.program_id IS NULL)";
        params.push(parseInt(program_id, 10));
      }
    } else if (['Grade 11', 'Grade 12'].includes(targetGradeLevel)) {
      sql += " AND s.level_category = 'SHS'";
      if (program_id && program_id !== 'null' && program_id !== 'undefined' && program_id !== '') {
        sql += " AND (s.program_id = ? OR s.program_id IS NULL)";
        params.push(parseInt(program_id, 10));
      }
    } else {
      sql += " AND s.level_category = 'K-10'";
    }

    sql += " ORDER BY sec.grade_level ASC, s.subject_code ASC";

    const [classes] = await pool.query(sql, params);
    return res.status(200).json({ success: true, classes: classes || [] });
  } catch (error) {
    console.error("getAvailableClasses error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};
