import pool from '../api/config/db.js';

async function main() {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables in database:", tables);
  } catch (err) {
    console.error("Error checking tables:", err);
  } finally {
    process.exit(0);
  }
}

main();
