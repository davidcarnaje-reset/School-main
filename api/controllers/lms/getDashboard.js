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
    const idCandidates = Array.from(new Set([
      String(rawStudentId),
      String(studentId)
    ]));

    const taskQuery = `
      SELECT 
          a.id,
          a.class_id,
          a.title,
          a.category,
          s.subject_code as \`desc\`,
          s.subject_description as subject_name,
          COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), 'Teacher') as teacher,
          a.open_date,
          a.due_date,
          a.due_date as duration,
          DATE_FORMAT(a.open_date, '%b %d, %Y • %h:%i %p') as open_date_formatted,
          DATE_FORMAT(a.due_date, '%b %d, %Y • %h:%i %p') as due_date_formatted,
          CASE WHEN a.due_date IS NOT NULL AND NOW() > a.due_date THEN 1 ELSE 0 END as is_closed_db,
          CASE WHEN a.open_date IS NOT NULL AND NOW() < a.open_date THEN 1 ELSE 0 END as is_not_open_yet_db
      FROM activities a
      JOIN class_assignments c ON a.class_id = c.id
      JOIN enrolled_classes ec ON c.id = ec.class_assignment_id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id IN (?)
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
        AND (sas.status IS NULL OR sas.status = 'Pending')
        AND NOT EXISTS (
          SELECT 1 FROM student_submissions sub 
          WHERE sub.activity_id = a.id AND sub.student_id IN (?)
        )
      ORDER BY (a.due_date IS NULL) ASC, a.due_date ASC, a.created_at DESC
      LIMIT 6
    `;
    const [tasksResult] = await pool.query(taskQuery, [idCandidates, idCandidates, idCandidates]);

    const nextLessons = tasksResult.map(row => {
      const now = new Date();
      let isClosed = Boolean(row.is_closed_db);
      let isNotOpenYet = Boolean(row.is_not_open_yet_db);

      if (row.due_date) {
        const dueDate = new Date(row.due_date);
        if (!isNaN(dueDate.getTime()) && now > dueDate) {
          isClosed = true;
        }
      }
      if (row.open_date) {
        const openDate = new Date(row.open_date);
        if (!isNaN(openDate.getTime()) && now < openDate) {
          isNotOpenYet = true;
        }
      }

      let durationStr = "No Due Date";
      if (row.due_date) {
        const date = new Date(row.due_date);
        if (!isNaN(date.getTime())) {
          durationStr = date.toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }

      let openDateStr = row.open_date_formatted || null;
      if (row.open_date) {
        const date = new Date(row.open_date);
        if (!isNaN(date.getTime())) {
          openDateStr = date.toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }

      return {
        id: row.id,
        class_id: row.class_id,
        title: row.title,
        category: row.category,
        desc: row.desc,
        subject: row.subject_name,
        teacher: row.teacher,
        open_date: row.open_date,
        due_date: row.due_date,
        duration: durationStr,
        open_date_formatted: openDateStr,
        is_closed: isClosed,
        is_not_open_yet: isNotOpenYet
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
