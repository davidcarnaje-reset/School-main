import pool from '../../config/db.js';

const getStudentDashboardData = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    // 1. KUNIN ANG LOGINS AT STUDY TIME MULA SA STUDENTS TABLE
    const [statsRows] = await pool.query(
      "SELECT lms_login_count, lms_total_minutes FROM students WHERE student_id = ?",
      [student_id]
    );
    const studentStats = statsRows[0] || {};
    const lms_logins = studentStats.lms_login_count || 0;
    const study_minutes = studentStats.lms_total_minutes || 0;

    // 2. KUNIN ANG SCHEDULE NGAYONG ARAW
    const dayOfWeek = new Date().getDay();
    const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const todayLetter = dayMap[dayOfWeek];

    const scheduleQuery = `
      SELECT 
          s.subject_code AS subject,
          s.subject_description AS description,
          r.room_name AS room,
          ca.schedule AS time
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
        AND ca.days LIKE ?
    `;
    const [scheduleToday] = await pool.query(scheduleQuery, [student_id, `%${todayLetter}%`]);

    // 3. KUNIN ANG PENDING TASKS
    const tasksQuery = `
      SELECT 
          a.title,
          s.subject_code AS subject,
          DATE_FORMAT(a.due_date, '%M %d, %Y') as due
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      JOIN activities a ON ca.id = a.class_id
      LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
        AND (sas.status IS NULL OR sas.status = 'Pending')
      ORDER BY a.due_date ASC 
      LIMIT 5
    `;
    const [pendingTasks] = await pool.query(tasksQuery, [student_id]);

    // 4. I-CALCULATE ANG TASK COMPLETION RATE (%)
    const totalActQuery = `
      SELECT COUNT(a.id) as total 
      FROM enrolled_classes ec
      JOIN activities a ON ec.class_assignment_id = a.class_id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
    `;
    const [totalActRows] = await pool.query(totalActQuery, [student_id]);
    const totalActivities = totalActRows[0] ? totalActRows[0].total : 0;

    const compActQuery = `
      SELECT COUNT(sas.id) as completed 
      FROM enrolled_classes ec
      JOIN activities a ON ec.class_assignment_id = a.class_id
      JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled' 
        AND sas.status IN ('Submitted', 'Graded')
    `;
    const [compActRows] = await pool.query(compActQuery, [student_id]);
    const completedActivities = compActRows[0] ? compActRows[0].completed : 0;

    let completionRate = 0;
    if (totalActivities > 0) {
      completionRate = Math.round((completedActivities / totalActivities) * 100);
    }

    return res.json({
      success: true,
      scheduleToday: scheduleToday || [],
      pendingTasks: pendingTasks || [],
      analytics: {
        totalMinutes: study_minutes,
        sessions: lms_logins,
        completionRate: completionRate
      }
    });

  } catch (error) {
    console.error("Get student dashboard error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default getStudentDashboardData;
