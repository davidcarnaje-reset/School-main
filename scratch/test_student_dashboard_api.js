import getStudentDashboardData from '../api/controllers/student/getStudentDashboardData.js';

async function test() {
  const req = {
    query: {
      student_id: 'K12-2026-0002'
    }
  };
  const res = {
    status: (code) => ({
      json: (data) => console.log('Response code ' + code + ':', data)
    }),
    json: (data) => {
      console.log('Success:', data.success);
      console.log('Schedule today:', JSON.stringify(data.scheduleToday, null, 2));
      console.log('Pending tasks:', JSON.stringify(data.pendingTasks, null, 2));
    }
  };

  await getStudentDashboardData(req, res);
  process.exit(0);
}

test().catch(console.error);

