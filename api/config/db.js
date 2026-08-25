import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const database = process.env.DB_NAME || 'sms_db';

const ISRG_ROOT_X1 = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`;

const poolConfig = {
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Always apply SSL if connecting to TiDB Cloud or if DB_SSL_CA is defined
if (host.includes('tidbcloud.com') || process.env.DB_SSL_CA) {
  poolConfig.ssl = {
    ca: ISRG_ROOT_X1,
    rejectUnauthorized: true
  };
}

const pool = mysql.createPool(poolConfig);

// Catch fatal database connection errors to prevent process crashes
pool.on('error', (err) => {
  console.error('⚠️ [DATABASE POOL ALERT] Connection error emitted:', err.message);
});

// Auto-patch schema for category column truncation
(async () => {
  try {
    await pool.query("ALTER TABLE fees_catalog MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Other'");
  } catch (err) {
    // Ignore if table doesn't exist yet or already altered
  }
})();

// Auto-patch schema for employee prefixes
(async () => {
  try {
    await pool.query("ALTER TABLE school_settings ADD COLUMN prefix_faculty VARCHAR(50) NOT NULL DEFAULT 'SF'");
  } catch (err) {
    // Ignore if already altered
  }
  try {
    await pool.query("ALTER TABLE school_settings ADD COLUMN prefix_staff VARCHAR(50) NOT NULL DEFAULT 'SA'");
  } catch (err) {
    // Ignore if already altered
  }
})();

// Auto-patch schema for employee shifts
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_shifts (
        user_id INT PRIMARY KEY,
        shift_id VARCHAR(50) NOT NULL,
        shift_name VARCHAR(100) NOT NULL,
        time_in VARCHAR(50) NOT NULL,
        time_out VARCHAR(50) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error("Failed to initialize employee_shifts table:", err.message);
  }
})();

// Guidance Counselor Tables initialization
(async () => {
  try {
    // 1. guidance_cases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guidance_cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        student_id VARCHAR(100) NOT NULL,
        counselor_id INT DEFAULT NULL,
        case_title VARCHAR(255) NOT NULL,
        case_type VARCHAR(100) NOT NULL,
        severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
        status ENUM('Active', 'Under Observation', 'Resolved', 'Referred') DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. guidance_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guidance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id INT NOT NULL,
        session_date DATE NOT NULL,
        action_plan TEXT,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. guidance_test_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guidance_test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        student_id VARCHAR(100) NOT NULL,
        test_type VARCHAR(100) NOT NULL,
        raw_scores_json JSON,
        personality_type VARCHAR(100),
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. guidance_appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guidance_appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        student_id VARCHAR(100) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        reason TEXT,
        status ENUM('Pending', 'Approved', 'Cancelled', 'Completed') DEFAULT 'Pending',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. guidance_incidents table (for student reporting / bullying distress)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guidance_incidents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        student_id VARCHAR(100) NOT NULL,
        incident_date DATE NOT NULL,
        details TEXT NOT NULL,
        is_anonymous TINYINT(1) DEFAULT 0,
        status ENUM('Reported', 'Under Review', 'Investigating', 'Action Taken', 'Archived') DEFAULT 'Reported',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

  } catch (err) {
    console.error("Guidance tables initialization failed:", err.message);
  }
})();

// School Nurse / Health Portal Tables initialization
(async () => {
  try {
    // 1. health_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS health_profiles (
        student_id VARCHAR(100) PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        blood_type VARCHAR(10) DEFAULT NULL,
        allergies TEXT DEFAULT NULL,
        chronic_illnesses TEXT DEFAULT NULL,
        emergency_contact_name VARCHAR(255) DEFAULT NULL,
        emergency_contact_no VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. health_checks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        student_id VARCHAR(100) NOT NULL,
        height DECIMAL(5,2) DEFAULT NULL,
        weight DECIMAL(5,2) DEFAULT NULL,
        bmi DECIMAL(4,2) DEFAULT NULL,
        blood_pressure VARCHAR(20) DEFAULT NULL,
        temperature DECIMAL(4,2) DEFAULT NULL,
        check_date DATE NOT NULL,
        status ENUM('Healthy', 'Underweight', 'Overweight', 'Needs Attention') DEFAULT 'Healthy',
        remarks TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. clinic_visits table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinic_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        student_id VARCHAR(100) NOT NULL,
        visit_date DATE NOT NULL,
        visit_time TIME NOT NULL,
        complaint TEXT NOT NULL,
        treatment TEXT DEFAULT NULL,
        medicine_dispensed VARCHAR(255) DEFAULT NULL,
        medicine_qty INT DEFAULT 0,
        outcome ENUM('Rested', 'Returned to Class', 'Sent Home', 'Referred to Hospital') DEFAULT 'Returned to Class',
        remarks TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. clinic_inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinic_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL DEFAULT 1,
        medicine_name VARCHAR(255) NOT NULL,
        stock_qty INT DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'tabs',
        expiration_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

  } catch (err) {
    console.error("School Nurse tables initialization failed:", err.message);
  }
})();

export default pool;

