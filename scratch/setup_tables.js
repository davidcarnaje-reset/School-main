import pool from '../api/config/db.js';

async function main() {
  try {
    console.log("Starting table creation for Employee Portal...");

    // 1. employee_requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_requests (
        id INT PRIMARY KEY,
        employee_id INT NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        details TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        remarks TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_by INT NULL,
        approved_at DATETIME NULL
      )
    `);
    console.log("Table employee_requests verified/created.");

    // 2. employee_dtr
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_dtr (
        id INT PRIMARY KEY,
        employee_id INT NOT NULL,
        log_date DATE NOT NULL,
        time_in TIME NULL,
        time_out TIME NULL,
        ot_hours DECIMAL(5,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'On Time',
        UNIQUE KEY uq_emp_date (employee_id, log_date)
      )
    `);
    console.log("Table employee_dtr verified/created.");

    // 3. employee_expenses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_expenses (
        id INT PRIMARY KEY,
        employee_id INT NOT NULL,
        expense_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        receipt_attachment VARCHAR(255) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table employee_expenses verified/created.");

    // 4. purchase_requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_requests (
        id INT PRIMARY KEY,
        employee_id INT NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        estimated_cost DECIMAL(10,2) NOT NULL,
        purpose TEXT NOT NULL,
        department VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table purchase_requests verified/created.");

    // 5. wfh_accomplishments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wfh_accomplishments (
        id INT PRIMARY KEY,
        employee_id INT NOT NULL,
        log_date DATE NOT NULL,
        description TEXT NOT NULL,
        attachment VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table wfh_accomplishments verified/created.");

    // 6. employee_notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_notifications (
        id INT PRIMARY KEY,
        employee_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table employee_notifications verified/created.");

    console.log("Database schema setup complete!");
  } catch (err) {
    console.error("Error setting up database tables:", err);
  } finally {
    process.exit(0);
  }
}

main();
