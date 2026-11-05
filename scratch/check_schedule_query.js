import pool from '../api/config/db.js';

async function check() {
  const [cas] = await pool.query("SELECT id, subject_id, section_id, days, schedule, start_time, end_time FROM class_assignments WHERE id IN (1,2,3,4,5,6,7)");
  console.log('Class assignments 1..7:', JSON.stringify(cas, null, 2));

  // Let's call getStudentSchedule directly or run the query from getStudentSchedule
  const idCandidates = ['K12-2026-0002', '2'];
  const query = `
    SELECT DISTINCT
      ca.id as class_id,
      s.subject_code as code,
      s.subject_description as subject,
      ca.days,
      ca.schedule,
      TIME_FORMAT(ca.start_time, '%h:%i %p') as startTime,
      TIME_FORMAT(ca.end_time, '%h:%i %p') as endTime
    FROM enrolled_classes ec
    JOIN class_assignments ca ON ec.class_assignment_id = ca.id
    JOIN subjects s ON ca.subject_id = s.id
    WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
  `;
  const [schedule] = await pool.query(query, [idCandidates]);
  console.log('Schedule result:', JSON.stringify(schedule, null, 2));

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
      s.subject_description as subject
    FROM activities a
    JOIN class_assignments ca ON a.class_id = ca.id
    JOIN subjects s ON ca.subject_id = s.id
    WHERE a.class_id IN (1,2,3,4,5,6,7)
  `;
  const [tasks] = await pool.query(tasksQuery);
  console.log('Tasks result:', JSON.stringify(tasks, null, 2));

  process.exit(0);
}
check().catch(console.error);

