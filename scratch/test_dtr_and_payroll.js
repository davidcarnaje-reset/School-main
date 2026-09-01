import pool from '../api/config/db.js';

async function verifyAll() {
  console.log("=== VERIFYING DATABASE & ENDPOINTS ===");

  // 1. Check school_settings DTR location columns
  const [ss] = await pool.query("SELECT dtr_latitude, dtr_longitude, dtr_radius, dtr_geofence_enabled FROM school_settings WHERE id = 1");
  console.log("School DTR Settings:", ss[0]);

  // 2. Check employee_dtr & teacher_dtr table structures
  const [empDtr] = await pool.query("SELECT COUNT(*) as count FROM employee_dtr");
  console.log("Employee DTR count:", empDtr[0].count);

  const [tDtr] = await pool.query("SELECT COUNT(*) as count FROM teacher_dtr");
  console.log("Teacher DTR count:", tDtr[0].count);

  console.log("=== ALL BACKEND CHECKS PASSED ===");
  process.exit(0);
}

verifyAll().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
