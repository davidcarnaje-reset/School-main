import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const database = process.env.DB_NAME || 'sms_db';

const poolConfig = {
  host,
  port,
  user,
  password,
  database,
};

// Always apply SSL if connecting to TiDB Cloud or if DB_SSL_CA is defined
if (host.includes('tidbcloud.com') || process.env.DB_SSL_CA) {
  try {
    let certPath = path.join(__dirname, 'certs', 'isrgrootx1.pem');
    
    // Fallback to DB_SSL_CA if the cert is not at the expected location
    if (!fs.existsSync(certPath) && process.env.DB_SSL_CA) {
      certPath = path.resolve(process.env.DB_SSL_CA);
    }

    if (fs.existsSync(certPath)) {
      poolConfig.ssl = {
        ca: fs.readFileSync(certPath),
        rejectUnauthorized: true
      };
    } else {
      throw new Error(`SSL Certificate not found at path: ${certPath}`);
    }
  } catch (error) {
    console.error('Error configuring SSL CA for DB connection:', error.message);
    if (host.includes('tidbcloud.com')) {
      throw error; // Force failure rather than insecure connection attempt
    }
  }
}

const pool = mysql.createPool(poolConfig);

export default pool;
