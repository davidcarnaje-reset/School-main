import pool from '../api/config/db.js';

async function main() {
  try {
    const [empRows] = await pool.query("SELECT * FROM employees");
    console.log("Employees in DB:", empRows);
    const [users] = await pool.query("SELECT id, username, first_name, last_name, email, role FROM users WHERE LOWER(role) NOT IN ('student', 'super_admin')");
    console.log("Staff Users in DB:", users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
