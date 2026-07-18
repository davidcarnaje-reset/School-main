import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if (process.env.DB_HOST && (process.env.DB_HOST.includes('tidbcloud.com') || process.env.DB_SSL_CA)) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

async function main() {
  const connection = await mysql.createConnection(poolConfig);
  try {
    let query = `
      SELECT 
        al.log_id as id, 
        al.user_id, 
        al.user_role, 
        al.action_type, 
        al.description, 
        al.ip_address, 
        al.created_at as timestamp,
        CASE 
          WHEN al.user_role = 'student' THEN (
            SELECT CONCAT(first_name, ' ', last_name) 
            FROM students 
            WHERE student_id COLLATE utf8mb4_general_ci = CAST(al.user_id AS CHAR) COLLATE utf8mb4_general_ci
            LIMIT 1
          )
          ELSE (
            SELECT full_name 
            FROM users 
            WHERE id = al.user_id 
            LIMIT 1
          )
        END as actor_name
      FROM audit_logs al
    `;
    const [rows] = await connection.execute(query);
    console.log("=== RESOLVED LOG ENTRIES ===");
    console.log(rows);
  } catch (e) {
    console.error("Query test failed:", e.message);
  }
  await connection.end();
}

main();
