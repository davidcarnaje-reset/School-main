import dash from '../api/controllers/student/getStudentDashboardData.js';
import * as ann from '../api/controllers/notifications/getStudentAnnouncements.js';

const mk = (l) => ({ code: 200, status(c) { this.code = c; return this; }, json(o) { console.log(l, this.code, JSON.stringify(o).slice(0, 1200)); } });
const sid = 'K12-2026-0002';
try {
  await dash({ query: { student_id: sid } }, mk('DASH'));
  const fn = ann.default?.getStudentAnnouncements || ann.getStudentAnnouncements || ann.default;
  await fn({ query: { student_id: sid } }, mk('ANN'));
} catch (e) { console.error('ERR', e); }
process.exit(0);

