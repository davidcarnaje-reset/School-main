import pool from '../api/config/db.js';
import { getActivityScores } from '../api/controllers/teacher/gradingController.js';
import { getExamDetails } from '../api/controllers/lms/examController.js';

const mkRes = (label) => ({
  code: 200,
  status(c) { this.code = c; return this; },
  json(o) { console.log(label, 'HTTP', this.code, JSON.stringify(o).slice(0, 900)); }
});

try {
  const [acts] = await pool.query("SELECT id, class_id, title, category FROM activities ORDER BY id DESC LIMIT 5");
  console.log('activities:', acts);
  if (acts[0]) {
    await getActivityScores({ query: { activity_id: String(acts[0].id) } }, mkRes('SCORES'));
    await getExamDetails({ query: { activity_id: String(acts[0].id), student_id: 'K12-2026-0002' } }, mkRes('EXAM'));
  }
  const [sas] = await pool.query("SELECT activity_id, student_id, status FROM student_activity_scores ORDER BY id DESC LIMIT 5");
  console.log('sas:', sas);
} catch (e) { console.error('DIAG ERROR:', e); }
process.exit(0);

