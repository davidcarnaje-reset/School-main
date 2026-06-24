import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

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

// Apply SSL configuration if DB_SSL_CA path is defined
if (process.env.DB_SSL_CA) {
  try {
    const certPath = path.resolve(process.env.DB_SSL_CA);
    poolConfig.ssl = {
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: true
    };
  } catch (error) {
    console.error(`Error reading SSL CA certificate file at ${process.env.DB_SSL_CA}:`, error);
  }
}

const pool = mysql.createPool(poolConfig);

export default pool;
