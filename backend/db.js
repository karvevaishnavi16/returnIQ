// ============================================================
// FILE: backend/db.js
// PURPOSE: MySQL database connection pool using promises
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'returniq',
  waitForConnections: true,
  connectionLimit: 10, // Maintain up to 10 connections
  queueLimit: 0
});

// Simple query wrapper to execute SQL statements
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    console.error(`Database Query Error executing: ${sql}`, err.message);
    throw err;
  }
}

// Export the connection pool and query wrapper
module.exports = {
  pool,
  query
};
