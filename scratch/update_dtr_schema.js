import pool from '../api/config/db.js';

async function updateSchema() {
  const alterQueries = [
    "ALTER TABLE school_settings ADD COLUMN dtr_latitude DECIMAL(10,8) DEFAULT 14.90791670",
    "ALTER TABLE school_settings ADD COLUMN dtr_longitude DECIMAL(11,8) DEFAULT 121.03316670",
    "ALTER TABLE school_settings ADD COLUMN dtr_radius INT DEFAULT 150",
    "ALTER TABLE school_settings ADD COLUMN dtr_geofence_enabled TINYINT(1) DEFAULT 1"
  ];

  for (let q of alterQueries) {
    try {
      await pool.query(q);
      console.log('Executed:', q);
    } catch (e) {
      console.log('Notice:', e.message);
    }
  }

  const [rows] = await pool.query('SELECT * FROM school_settings WHERE id = 1');
  console.log('Updated school_settings row 1:', rows[0]);
  process.exit(0);
}

updateSchema();
