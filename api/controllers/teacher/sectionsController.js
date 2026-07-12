import pool from '../../config/db.js';

export const getSections = async (req, res) => {
  const teacherId = req.query.teacher_id;

  if (!teacherId) {
    return res.status(400).json({ status: "error", message: "Teacher ID is required." });
  }

  try {
    const listQuery = `
      SELECT 
        ca.id, 
        COALESCE(sec.section_name, 'TBA') as section_name, 
        sec.grade_level as level,
        sec.department,
        s.level_category,
        ca.school_year,
        COALESCE(r.room_name, 'TBA') as room,
        ca.schedule,
        s.subject_description as subject,
        (SELECT COUNT(e.student_id) FROM enrollments e 
         WHERE e.section_id = ca.section_id 
         AND e.status = 'Enrolled') as student_count
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.teacher_id = ? AND ca.is_active = 1
    `;

    const uniqueCountQuery = `
      SELECT COUNT(DISTINCT e.student_id) as total_unique_students 
      FROM class_assignments ca
      JOIN enrollments e ON ca.section_id = e.section_id
      WHERE ca.teacher_id = ? 
        AND ca.is_active = 1 
        AND e.status = 'Enrolled'
    `;

    const [sections] = await pool.query(listQuery, [teacherId]);
    const [counts] = await pool.query(uniqueCountQuery, [teacherId]);

    const totalOverallStudents = counts[0] ? parseInt(counts[0].total_unique_students || 0, 10) : 0;

    return res.json({
      status: "success",
      total_overall_students: totalOverallStudents,
      data: sections || []
    });

  } catch (error) {
    console.error("Get sections error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default { getSections };
