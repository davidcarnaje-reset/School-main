import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

export const getAllCourses = async (req, res) => {
  const rawStudentId = req.query.student_id;

  if (!rawStudentId) {
    return res.status(400).json({ status: 'error', message: 'Missing student_id' });
  }

  try {
    const studentId = await resolveStudentId(rawStudentId);
    
    // Auto-sync officially enrolled classes for this student
    await syncStudentEnrolledClasses(studentId);

    const query = `
      SELECT 
        ca.id as class_id,
        s.subject_code as tag,
        s.subject_description as title,
        LOWER(COALESCE(s.subject_type, 'core')) as category, 
        COALESCE(s.level_category, sec.department, 'K-10') as level_category,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), 'To Be Assigned') as teacher,
        u.profile_image as teacher_image,
        sec.section_name,
        ca.schedule,
        ca.days,
        TIME_FORMAT(ca.start_time, '%h:%i %p') as start_time,
        TIME_FORMAT(ca.end_time, '%h:%i %p') as end_time,
        r.room_name as room,
        (SELECT COUNT(*) FROM enrolled_classes WHERE class_assignment_id = ca.id AND status = 'Enrolled') as student_count,
        (SELECT COUNT(*) FROM classroom_modules WHERE class_id = ca.id) as total_lessons,
        (SELECT COUNT(*) FROM student_lesson_progress WHERE class_assignment_id = ca.id AND student_id = ?) as completed_lessons
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN rooms r ON ca.room_id = r.id
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
