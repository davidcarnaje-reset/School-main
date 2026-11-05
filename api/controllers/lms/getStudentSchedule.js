import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

export const getStudentSchedule = async (req, res) => {
  const rawStudentId = req.query.student_id;

  if (!rawStudentId) {
    return res.status(400).json({ status: 'error', message: 'Missing student ID' });
  }

  try {
    const studentId = await resolveStudentId(rawStudentId);

    // Auto-sync officially enrolled classes
    await syncStudentEnrolledClasses(studentId);

    // Resolve both numeric ID and string student_id so enrolled_classes matches either format
    const [stuRows] = await pool.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [studentId, rawStudentId]
    );
    const idCandidates = Array.from(new Set([
      String(rawStudentId),
      String(studentId),
      ...(stuRows[0]?.id ? [String(stuRows[0].id)] : []),
      ...(stuRows[0]?.student_id ? [String(stuRows[0].student_id)] : [])
    ]));

    const query = `
      SELECT DISTINCT
        ca.id as class_id,
        s.subject_code as code,
        s.subject_description as subject,
        ca.days,
        ca.schedule,
        ca.start_time,
        ca.end_time,
        TIME_FORMAT(ca.start_time, '%h:%i %p') as startTime,
        TIME_FORMAT(ca.end_time, '%h:%i %p') as endTime,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), 'To Be Assigned') as teacher,
        u.profile_image as teacher_image,
        COALESCE(r.room_name, 'TBA') as room,
        sec.section_name
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
      ORDER BY ca.start_time ASC, s.subject_code ASC
    `;

    const [schedule] = await pool.query(query, [idCandidates]);

    // Dynamic colors for UI visual interest
    const bgColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
    schedule.forEach((classItem, index) => {
      classItem.color = bgColors[index % bgColors.length];
    });

    // Also fetch all activities/tasks for these enrolled classes so calendar deadlines & assigned dates work
    let tasks = [];
    if (schedule.length > 0) {
      const classIds = schedule.map(c => c.class_id);
      const tasksQuery = `
        SELECT
          a.id,
          a.class_id,
          a.title,
          a.category,
          a.max_score,
          DATE_FORMAT(a.due_date, '%Y-%m-%d') as due_date,
          DATE_FORMAT(a.created_at, '%Y-%m-%d') as assigned_date,
          s.subject_code as code,
          s.subject_description as subject,
          COALESCE(sas.status, 'Pending') as status,
          sas.score
        FROM activities a
        JOIN class_assignments ca ON a.class_id = ca.id
        JOIN subjects s ON ca.subject_id = s.id
        LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id IN (?)
        WHERE a.class_id IN (?)
        ORDER BY a.due_date ASC, a.created_at DESC
      `;
      const [taskRows] = await pool.query(tasksQuery, [idCandidates, classIds]);
      tasks = taskRows;
    }

    return res.json({
      status: 'success',
      schedule: schedule,
      tasks: tasks
    });

  } catch (error) {
    console.error("Schedule API Error:", error);
    return res.status(500).json({ status: 'error', message: 'Database error' });
  }
};

export default getStudentSchedule;
