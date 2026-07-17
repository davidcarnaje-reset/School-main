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
  const tables = ['academic_programs', 'subjects', 'students', 'enrollments'];
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SHOW CREATE TABLE \`${table}\``);
      console.log(`\n=== CREATE TABLE ${table} ===`);
      console.log(rows[0]['Create Table']);
    } catch (e) {
      console.error(`Error showing table ${table}:`, e.message);
    }
  }
  await connection.end();
}

main();
