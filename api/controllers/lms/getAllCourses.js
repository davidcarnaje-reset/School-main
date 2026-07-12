import pool from '../../config/db.js';

export const getAllCourses = async (req, res) => {
  const studentId = req.query.student_id;

  if (!studentId) {
    return res.status(400).json({ status: 'error', message: 'Missing student_id' });
  }

  try {
    const query = `
      SELECT 
        ca.id as class_id,
        s.subject_code as tag,
        s.subject_description as title,
        LOWER(s.subject_type) as category, 
        s.level_category,
        CONCAT(u.first_name, ' ', u.last_name) as teacher,
        (SELECT COUNT(*) FROM enrolled_classes WHERE class_assignment_id = ca.id AND status = 'Enrolled') as student_count,
        (SELECT COUNT(*) FROM classroom_modules WHERE class_id = ca.id) as total_lessons,
        (SELECT COUNT(*) FROM student_lesson_progress WHERE class_assignment_id = ca.id AND student_id = ?) as completed_lessons
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      JOIN users u ON ca.teacher_id = u.id
      WHERE ec.student_id = ?
        AND ec.status = 'Enrolled'
      ORDER BY s.subject_code ASC
    `;

    const [rows] = await pool.query(query, [studentId, studentId]);

    return res.json({
      status: 'success',
      count: rows.length,
      courses: rows
    });

  } catch (error) {
    console.error("LMS API Error (getAllCourses):", error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export default getAllCourses;
