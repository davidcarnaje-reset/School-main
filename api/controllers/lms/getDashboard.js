import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

const getDashboard = async (req, res) => {
  const rawStudentId = req.query.student_id;

  if (!rawStudentId) {
    return res.status(400).json({ status: "error", message: "Missing student_id" });
  }

  try {
    const studentId = await resolveStudentId(rawStudentId);

    // Auto-sync officially enrolled classes
    await syncStudentEnrolledClasses(studentId);

    // 1. KUNIN ANG ANALYTICS (Time spent & Logins)
    const [statsRows] = await pool.query(
      "SELECT lms_login_count, lms_total_minutes FROM students WHERE student_id = ?",
      [studentId]
    );
    let stats = statsRows[0];
    if (!stats) {
      stats = { lms_login_count: 0, lms_total_minutes: 0 };
    }

    // 2. KUNIN ANG MGA ENROLLED SUBJECTS + CLASS POPULATION + TOTAL MODULES + TEACHER
    const subjQuery = `
      SELECT 
          c.id as class_id,
          s.subject_code as tag,
          s.subject_description as title,
          COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), 'To Be Assigned') as teacher,
          u.profile_image as teacher_image,
          sec.section_name,
          c.schedule,
          r.room_name as room,
          ec.last_accessed, 
          (SELECT COUNT(*) FROM enrolled_classes WHERE class_assignment_id = c.id AND status = 'Enrolled') as student_count,
          (SELECT COUNT(*) FROM classroom_modules WHERE class_id = c.id) as total_lessons,
          (SELECT COUNT(*) FROM student_lesson_progress WHERE class_assignment_id = c.id AND student_id = ?) as completed_lessons
      FROM enrolled_classes ec
      JOIN class_assignments c ON ec.class_assignment_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN sections sec ON c.section_id = sec.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
      ORDER BY ec.last_accessed DESC, s.subject_code ASC
      LIMIT 6
    `;
    const [subjectsResult] = await pool.query(subjQuery, [studentId, studentId]);

    const colors = ['#2563eb', '#059669', '#7c3aed', '#db2777', '#ea580c'];
    const courses = subjectsResult.map((row, index) => {
      const totalLessons = parseInt(row.total_lessons, 10) || 0;
      const completedLessons = parseInt(row.completed_lessons, 10) || 0;
      
      return {
        ...row,
        color: colors[index % colors.length],
        student_count: parseInt(row.student_count, 10) || 0,
        progress: completedLessons,
        total: totalLessons > 0 ? totalLessons : 1
      };
    });

    // 3. KUNIN ANG MGA PENDING ACTIVITIES/TASKS
    const taskQuery = `
      SELECT 
          a.class_id,
          a.title,
          s.subject_code as \`desc\`,
          COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), 'Teacher') as teacher,
          a.due_date as duration
      FROM activities a
      JOIN class_assignments c ON a.class_id = c.id
      JOIN enrolled_classes ec ON c.id = ec.class_assignment_id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
        AND (sas.status IS NULL OR sas.status = 'Pending')
        AND a.due_date > NOW()
      ORDER BY a.due_date ASC 
      LIMIT 4
    `;
    const [tasksResult] = await pool.query(taskQuery, [studentId]);

    const nextLessons = tasksResult.map(row => {
      let durationStr = "No Due Date";
      if (row.duration) {
        const date = new Date(row.duration);
        if (!isNaN(date.getTime())) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const m = months[date.getMonth()];
          const d = date.getDate();
          
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          
          durationStr = `${m} ${d}, ${hours}:${minutes} ${ampm}`;
        }
      }
      return {
        class_id: row.class_id,
        title: row.title,
        desc: row.desc,
        teacher: row.teacher,
        duration: durationStr
      };
    });

    return res.json({
      status: "success",
      stats: stats,
      courses: courses,
      nextLessons: nextLessons
    });

  } catch (error) {
    console.error("LMS dashboard data query error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default getDashboard;
