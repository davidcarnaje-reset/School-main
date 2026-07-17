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

async function addColumnIfNotExists(connection, table, column, definition) {
  try {
    // Check if column exists
    const [columns] = await connection.execute(`DESCRIBE \`${table}\``);
    const hasColumn = columns.some(col => col.Field === column);
    if (!hasColumn) {
      console.log(`Adding column '${column}' to table '${table}'...`);
      await connection.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`✅ Column '${column}' added successfully to table '${table}'.`);
    } else {
      console.log(`ℹ️ Column '${column}' already exists in table '${table}'.`);
    }
  } catch (error) {
    console.error(`❌ Error adding column '${column}' to table '${table}':`, error.message);
  }
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(poolConfig);
    console.log('🔌 Connected to the database.');

    // Add curriculum_year columns
    await addColumnIfNotExists(connection, 'academic_programs', 'curriculum_year', "VARCHAR(20) DEFAULT '2024-2025'");
    await addColumnIfNotExists(connection, 'subjects', 'curriculum_year', "VARCHAR(20) DEFAULT '2024-2025'");
    await addColumnIfNotExists(connection, 'students', 'curriculum_year', "VARCHAR(20) DEFAULT '2024-2025'");
    await addColumnIfNotExists(connection, 'enrollments', 'curriculum_year', "VARCHAR(20) DEFAULT '2024-2025'");

    console.log('🎉 Migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
