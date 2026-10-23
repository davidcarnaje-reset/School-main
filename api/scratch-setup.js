import pool from './config/db.js';

async function checkLevels() {
  try {
    const [eLevels] = await pool.query(`SELECT DISTINCT grade_level FROM enrollments WHERE grade_level IS NOT NULL`);
    console.log("ENROLLMENT GRADE LEVELS:", eLevels);

    const [progDeps] = await pool.query(`SELECT DISTINCT department FROM academic_programs WHERE department IS NOT NULL`);
    console.log("ACADEMIC PROGRAM DEPARTMENTS:", progDeps);

    const [allStudents] = await pool.query(`
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        s.first_name,
        s.last_name,
        e.grade_level,
        e.status as enrollment_status,
        ap.department,
        ap.program_code
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      LIMIT 15
    `);
    console.log("SAMPLE ENROLLMENTS:", allStudents);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkLevels();
