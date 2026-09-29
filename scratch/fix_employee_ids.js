import pool from '../api/config/db.js';

async function fixData() {
  try {
    console.log("1. Removing duplicate employee ID 8 (EMP-2026-0007)...");
    await pool.query("DELETE FROM employees WHERE id = 8");

    console.log("2. Normalizing Faculty employee IDs with 'SF' prefix...");
    // Jose Rizal
    await pool.query(
      "UPDATE employees SET employee_id = 'SF2026-0001', email = 'rizal@hero.ph', employee_type = 'Teaching' WHERE id = 6"
    );

    // Julliana Trixie Vidania
    await pool.query(
      "UPDATE employees SET employee_id = 'SF2026-0002', employee_type = 'Teaching' WHERE id = 7"
    );

    // Reynaldo Bernardo
    await pool.query(
      "UPDATE employees SET employee_id = 'SF2026-0003', employee_type = 'Teaching' WHERE id = 9"
    );

    // ronel Santos
    await pool.query(
      "UPDATE employees SET employee_id = 'SF2026-0004', employee_type = 'Teaching' WHERE id = 10"
    );

    console.log("3. Normalizing Staff employee IDs with 'SA' prefix...");
    // Linabelle Orocio
    await pool.query(
      "UPDATE employees SET employee_id = 'SA2026-0001', email = 'golal96758@neplis.com', employee_type = 'Non-Teaching' WHERE id = 2"
    );

    // Belerick Delos Reyes
    await pool.query(
      "UPDATE employees SET employee_id = 'SA2026-0002', email = 'komej50345@joystill.com', employee_type = 'Non-Teaching' WHERE id = 3"
    );

    // Miya Salamanca
    await pool.query(
      "UPDATE employees SET employee_id = 'SA2026-0003', email = 'lafatof787@kikaga.com', employee_type = 'Non-Teaching' WHERE id = 4"
    );

    console.log("4. Verification of current employees:");
    const [rows] = await pool.query("SELECT id, employee_id, first_name, last_name, position, department, email FROM employees ORDER BY id ASC");
    console.table(rows);

  } catch (err) {
    console.error("Fix error:", err);
  } finally {
    process.exit(0);
  }
}

fixData();
