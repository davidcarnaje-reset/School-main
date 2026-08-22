import pool from '../api/config/db.js';

async function main() {
  try {
    console.log("Cleaning up duplicate employees in database...");
    
    // Select all employees group by name to see duplicates
    const [rows] = await pool.query(`
      SELECT first_name, last_name, COUNT(*) as count 
      FROM employees 
      GROUP BY first_name, last_name 
      HAVING count > 1
    `);

    console.log("Duplicate names found:", rows);

    for (const dup of rows) {
      // Get all matching employees ordered by ID descending (so we keep the latest one)
      const [matches] = await pool.query(
        "SELECT id FROM employees WHERE TRIM(LOWER(first_name)) = TRIM(LOWER(?)) AND TRIM(LOWER(last_name)) = TRIM(LOWER(?)) ORDER BY id DESC",
        [dup.first_name, dup.last_name]
      );

      const keepId = matches[0].id;
      const deleteIds = matches.slice(1).map(m => m.id);

      if (deleteIds.length > 0) {
        console.log(`Keeping employee ID: ${keepId}, deleting duplicate IDs:`, deleteIds);
        await pool.query("DELETE FROM employees WHERE id IN (?)", [deleteIds]);
      }
    }

    console.log("Cleanup complete!");
  } catch (err) {
    console.error("Cleanup error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
