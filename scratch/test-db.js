import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from root .env (adjust path if running from scratch)
dotenv.config({ path: path.join(__dirname, '../.env') });

const host = process.env.DB_HOST;
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

console.log('Connecting with configuration:');
console.log('Host:', host);
console.log('Port:', port);
console.log('User:', user);
console.log('Database:', database);

const poolConfig = {
  host,
  port,
  user,
  password,
  database,
};

// Use the local cert path
const certPath = path.join(__dirname, '../api/config/certs/isrgrootx1.pem');
console.log('Using cert path:', certPath);

if (fs.existsSync(certPath)) {
  poolConfig.ssl = {
    ca: fs.readFileSync(certPath),
    rejectUnauthorized: true
  };
  console.log('SSL configuration loaded successfully.');
} else {
  console.log('SSL Certificate file not found at:', certPath);
}

async function testConnection() {
  try {
    const connection = await mysql.createConnection(poolConfig);
    console.log('✅ Connection SUCCESSFUL!');
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('Query result (1+1):', rows[0].result);
    await connection.end();
  } catch (error) {
    console.error('❌ Connection FAILED!');
    console.error('Error Details:', error);
  }
}

testConnection();
