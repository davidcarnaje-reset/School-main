import pool from '../api/config/db.js';

async function check() {
  try {
    const [cols] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sms_db' 
        AND (COLUMN_NAME LIKE '%employee%' OR COLUMN_NAME LIKE '%teacher%' OR COLUMN_NAME LIKE '%faculty%')
    `);
    console.table(cols);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
