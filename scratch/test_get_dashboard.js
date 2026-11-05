import getDashboard from '../api/controllers/lms/getDashboard.js';

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
      console.log('Status:', data.status);
      console.log('Courses count:', data.courses?.length);
      console.log('Courses:', data.courses?.map(c => ({ id: c.class_id, title: c.title, teacher: c.teacher })));
      console.log('Next lessons count:', data.nextLessons?.length);
      console.log('Next lessons:', data.nextLessons);
    }
  };

  await getDashboard(req, res);
  process.exit(0);
}

test().catch(console.error);

