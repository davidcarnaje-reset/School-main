import pool from '../../config/db.js';

const getDashboard = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ status: "error", message: "Missing student_id" });
  }

  try {
    // 1. KUNIN ANG ANALYTICS (Time spent & Logins)
    const [statsRows] = await pool.query(
      "SELECT lms_login_count, lms_total_minutes FROM students WHERE student_id = ?",
      [student_id]
    );
    let stats = statsRows[0];
    if (!stats) {
      stats = { lms_login_count: 0, lms_total_minutes: 0 };
    }

    // 2. KUNIN ANG MGA ENROLLED SUBJECTS + CLASS POPULATION + TOTAL MODULES
    const subjQuery = `
      SELECT 
          c.id as class_id,
          s.subject_code as tag,
          s.subject_description as title,
          ec.last_accessed, 
          (SELECT COUNT(*) FROM enrolled_classes WHERE class_assignment_id = c.id AND status = 'Enrolled') as student_count,
          (SELECT COUNT(*) FROM classroom_modules WHERE class_id = c.id) as total_lessons,
          (SELECT COUNT(*) FROM student_lesson_progress WHERE class_assignment_id = c.id AND student_id = ?) as completed_lessons
      FROM enrolled_classes ec
      JOIN class_assignments c ON ec.class_assignment_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
      ORDER BY ec.last_accessed DESC 
      LIMIT 3
    `;
    const [subjectsResult] = await pool.query(subjQuery, [student_id, student_id]);

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
          CONCAT(u.first_name, ' ', u.last_name) as teacher,
          a.due_date as duration
      FROM activities a
      JOIN class_assignments c ON a.class_id = c.id
      JOIN enrolled_classes ec ON c.id = ec.class_assignment_id
      JOIN subjects s ON c.subject_id = s.id
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
        AND (sas.status IS NULL OR sas.status = 'Pending')
        AND a.due_date > NOW()
      ORDER BY a.due_date ASC 
      LIMIT 4
    `;
    const [tasksResult] = await pool.query(taskQuery, [student_id]);

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
          hours = hours ? hours : 12; // the hour '0' should be '12'
          
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
