import pool from '../../config/db.js';

export const getStudentSchedule = async (req, res) => {
  const studentId = req.query.student_id;

  if (!studentId) {
    return res.status(400).json({ status: 'error', message: 'Missing student ID' });
  }

  try {
    const query = `
      SELECT 
        ca.id as class_id,
        s.subject_code as code,
        s.subject_description as subject,
        ca.days,
        TIME_FORMAT(ca.start_time, '%h:%i %p') as startTime,
        TIME_FORMAT(ca.end_time, '%h:%i %p') as endTime,
        CONCAT(u.first_name, ' ', u.last_name) as teacher,
        r.room_name as room
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ec.student_id = ? AND ec.status = 'Enrolled'
      ORDER BY ca.start_time ASC
    `;

    const [schedule] = await pool.query(query, [studentId]);

    // Dynamic colors for UI visual interest
    const bgColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
    schedule.forEach((classItem, index) => {
      classItem.color = bgColors[index % bgColors.length];
    });

    return res.json({
      status: 'success',
      schedule: schedule
    });

  } catch (error) {
    console.error("Schedule API Error:", error);
    return res.status(500).json({ status: 'error', message: 'Database error' });
  }
};

export default getStudentSchedule;
