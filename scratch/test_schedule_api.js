import getStudentSchedule from '../api/controllers/lms/getStudentSchedule.js';

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
      console.log('Response status:', data.status);
      console.log('Schedule count:', data.schedule?.length);
      console.log('Schedule:', JSON.stringify(data.schedule, null, 2));
      console.log('Tasks count:', data.tasks?.length);
      console.log('Tasks:', JSON.stringify(data.tasks, null, 2));
    }
  };

  await getStudentSchedule(req, res);
  process.exit(0);
}

test().catch(console.error);

