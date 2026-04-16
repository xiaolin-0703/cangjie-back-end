const mysql = require('mysql2/promise')
require('dotenv').config()

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT) || 3306
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'campus_app'

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
})

async function ensureDatabaseReady() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  })

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       DEFAULT CHARACTER SET utf8mb4
       COLLATE utf8mb4_unicode_ci`
    )

    await connection.query(`USE \`${DB_NAME}\``)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(100) NOT NULL UNIQUE,
        real_name VARCHAR(50) DEFAULT NULL,
        nickname VARCHAR(50) DEFAULT NULL,
        avatar_url VARCHAR(255) DEFAULT NULL,
        grade VARCHAR(20) DEFAULT NULL,
        department VARCHAR(100) DEFAULT NULL,
        student_no VARCHAR(50) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        bio VARCHAR(255) DEFAULT NULL,
        identity_mode ENUM('real', 'anonymous') NOT NULL DEFAULT 'real',
        student_verified TINYINT(1) NOT NULL DEFAULT 0,
        auth_status ENUM('unverified', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'unverified',
        auth_submitted_at DATETIME DEFAULT NULL,
        auth_reviewed_at DATETIME DEFAULT NULL,
        auth_reject_reason VARCHAR(255) DEFAULT NULL,
        profile_completed TINYINT(1) NOT NULL DEFAULT 0,
        status ENUM('active', 'banned', 'deleted') NOT NULL DEFAULT 'active',
        last_login_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_used_created (email, used, created_at),
        INDEX idx_expires_at (expires_at)
      )
    `)
  } finally {
    await connection.end()
  }
}

pool.ensureDatabaseReady = ensureDatabaseReady

module.exports = pool
