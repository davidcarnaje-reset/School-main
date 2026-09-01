import pool from '../api/config/db.js';

async function setupDtrTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_dtr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        record_date DATE NOT NULL,
        time_in TIME NULL,
        time_out TIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("teacher_dtr table ensured.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_dtr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        log_date DATE NOT NULL,
        time_in TIME NULL,
        time_out TIME NULL,
        ot_hours DECIMAL(5,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'On Time',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("employee_dtr table ensured.");

  } catch (err) {
    console.error("Error setting up DTR tables:", err);
  }
  process.exit(0);
}

setupDtrTables();
