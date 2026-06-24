import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jobify',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

export const execute = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

export const initDB = async () => {
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      lastName VARCHAR(255) DEFAULT 'lastName',
      location VARCHAR(255) DEFAULT 'my city',
      role ENUM('user','admin') DEFAULT 'user',
      avatar VARCHAR(1000),
      avatarPublicId VARCHAR(1000),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      jobStatus ENUM('pending','interview','declined') DEFAULT 'pending',
      jobType ENUM('full-time','part-time','internship') DEFAULT 'full-time',
      jobLocation VARCHAR(255) DEFAULT 'my city',
      createdBy INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};
