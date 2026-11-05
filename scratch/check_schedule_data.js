import pool from '../api/config/db.js';

async function check() {
  const [stu] = await pool.query("SELECT * FROM students WHERE first_name LIKE '%Nicole%' OR last_name LIKE '%Urdas%'");
  console.log('Students:', JSON.stringify(stu, null, 2));
  if (stu.length > 0) {
    const s = stu[0];
    const [enrolled] = await pool.query("SELECT * FROM enrolled_classes WHERE student_id = ? OR student_id = ?", [s.id, s.student_id]);
    console.log('Enrolled classes count:', enrolled.length, JSON.stringify(enrolled, null, 2));
    const [assignments] = await pool.query(
      "SELECT ca.*, s.subject_code, s.subject_description FROM class_assignments ca JOIN subjects s ON ca.subject_id = s.id WHERE ca.section_id = ?",
      [s.section_id]
    );
    console.log('Class assignments count:', assignments.length, JSON.stringify(assignments, null, 2));
    const [activities] = await pool.query("SELECT id, class_id, title, category, due_date, created_at FROM activities");
    console.log('Activities count:', activities.length, JSON.stringify(activities, null, 2));
  }
  process.exit(0);
}

check().catch(console.error);

