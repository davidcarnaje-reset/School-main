import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

const getStudentDashboardData = async (req, res) => {
  const rawStudentId = req.query.student_id;

  if (!rawStudentId) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    const studentId = await resolveStudentId(rawStudentId);

    // Auto-sync officially enrolled classes so newly enrolled students see their classes immediately
    await syncStudentEnrolledClasses(studentId);

    // 1. KUNIN ANG LOGINS AT STUDY TIME MULA SA STUDENTS TABLE (resolve both string & numeric IDs)
    const [statsRows] = await pool.query(
      "SELECT id, student_id, lms_login_count, lms_total_minutes FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [studentId, rawStudentId]
    );
    const studentStats = statsRows[0] || {};
    const lms_logins = studentStats.lms_login_count || 0;
    const study_minutes = studentStats.lms_total_minutes || 0;

    const idCandidates = Array.from(new Set([
      String(rawStudentId),
      String(studentId),
      ...(studentStats.id ? [String(studentStats.id)] : []),
      ...(studentStats.student_id ? [String(studentStats.student_id)] : [])
    ]));

    // 2. KUNIN ANG SCHEDULE NGAYONG ARAW
    const dayOfWeek = new Date().getDay();
    const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const todayLetter = dayMap[dayOfWeek];

    const scheduleQuery = `
      SELECT DISTINCT
          ca.id AS class_id,
          s.subject_code AS subject,
          s.subject_description AS description,
          r.room_name AS room,
          ca.schedule AS time
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
        AND ca.days LIKE ?
    `;
    const [scheduleToday] = await pool.query(scheduleQuery, [idCandidates, `%${todayLetter}%`]);

    // 3. KUNIN ANG PENDING TASKS
    const tasksQuery = `
      SELECT DISTINCT
          a.id,
          a.class_id,
          a.title,
          s.subject_code AS subject,
          DATE_FORMAT(a.due_date, '%M %d, %Y') as due,
          a.due_date AS due_date_raw,
          a.created_at AS created_raw
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      JOIN activities a ON ca.id = a.class_id
      LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id IN (?)
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
        AND (sas.status IS NULL OR sas.status = 'Pending')
      ORDER BY a.due_date IS NULL ASC, a.due_date ASC, a.created_at DESC
      LIMIT 5
    `;
    const [pendingTasks] = await pool.query(tasksQuery, [idCandidates, idCandidates]);

    // 4. I-CALCULATE ANG TASK COMPLETION RATE (%)
    const totalActQuery = `
      SELECT COUNT(DISTINCT a.id) as total 
      FROM enrolled_classes ec
      JOIN activities a ON ec.class_assignment_id = a.class_id
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
    `;
    const [totalActRows] = await pool.query(totalActQuery, [idCandidates]);
    const totalActivities = totalActRows[0] ? totalActRows[0].total : 0;

    const compActQuery = `
      SELECT COUNT(DISTINCT sas.activity_id) as completed 
      FROM enrolled_classes ec
      JOIN activities a ON ec.class_assignment_id = a.class_id
      JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id IN (?)
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled' 
        AND sas.status IN ('Submitted', 'Graded')
    `;
    const [compActRows] = await pool.query(compActQuery, [idCandidates, idCandidates]);
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
