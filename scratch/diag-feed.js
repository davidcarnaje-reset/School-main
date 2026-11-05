import pool from '../api/config/db.js';
import getClassroomFeed from '../api/controllers/lms/getClassroomFeed.js';

try {
  const [ec] = await pool.query("SELECT student_id, class_assignment_id FROM enrolled_classes ORDER BY id DESC LIMIT 3");
  console.log('enrolled_classes sample:', ec);
  for (const row of ec.slice(0, 1)) {
    const res = {
      code: 200,
      status(c) { this.code = c; return this; },
      json(o) { console.log('HTTP', this.code, JSON.stringify(o).slice(0, 1500)); }
    };
    await getClassroomFeed({ query: { student_id: row.student_id, class_id: String(row.class_assignment_id) } }, res);
  }
} catch (e) {
  console.error('DIAG ERROR:', e);
}
process.exit(0);

