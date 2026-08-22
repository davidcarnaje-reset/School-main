import pool from '../api/config/db.js';

async function main() {
  try {
    console.log("Adding employment_status column to employees table...");
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'Probationary'");
    console.log("Column added successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
