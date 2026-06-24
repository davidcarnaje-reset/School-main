import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Kukunin ang connection string mula sa environment variables
const connectionUri = process.env.DATABASE_URL || process.env.TIDB_CONNECTION_STRING;

let poolConfig;

if (connectionUri) {
  poolConfig = {
    uri: connectionUri,
    ssl: {
      // TiDB Serverless requires SSL connection
      rejectUnauthorized: true,
    }
  };
} else {
  const host = process.env.DB_HOST || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  poolConfig = {
    host: host,
    port: parseInt(process.env.DB_PORT, 10) || (isLocal ? 3306 : 4000),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'sms_db',
    // Huwag mag-require ng SSL sa local XAMPP database
    ssl: isLocal ? false : { rejectUnauthorized: true }
  };
}

const pool = mysql.createPool(poolConfig);

export default pool;
