import pool from '../api/config/db.js';

async function main() {
  try {
    console.log("Updating employees table schema with statutory and checklist columns...");

    const cols = [
      "ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50) NULL",
      "ADD COLUMN IF NOT EXISTS sss_number VARCHAR(50) NULL",
      "ADD COLUMN IF NOT EXISTS philhealth_number VARCHAR(50) NULL",
      "ADD COLUMN IF NOT EXISTS pagibig_number VARCHAR(50) NULL",
      "ADD COLUMN IF NOT EXISTS tin_number VARCHAR(50) NULL",
      "ADD COLUMN IF NOT EXISTS hmo_covered VARCHAR(10) DEFAULT 'No'",
      "ADD COLUMN IF NOT EXISTS hmo_details VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS psa_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS psa_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS coe_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS coe_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS nbi_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS nbi_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS sss_doc_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS sss_doc_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS philhealth_doc_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS philhealth_doc_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS pagibig_doc_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS pagibig_doc_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS tin_doc_status VARCHAR(20) DEFAULT 'Pending'",
      "ADD COLUMN IF NOT EXISTS tin_doc_file VARCHAR(255) NULL",
      "ADD COLUMN IF NOT EXISTS employment_history TEXT NULL"
    ];

    for (const col of cols) {
      try {
        await pool.query(`ALTER TABLE employees ${col}`);
      } catch (err) {
        console.warn(`Column update issue: ${col}`, err.message);
      }
    }

    console.log("Table alteration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

main();
