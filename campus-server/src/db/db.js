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
  queueLimit: 0,
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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        category VARCHAR(50) DEFAULT NULL,
        status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_tags (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        tag_id BIGINT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_tag (user_id, tag_id),
        INDEX idx_user_id (user_id),
        INDEX idx_tag_id (tag_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS circles (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        cover_url VARCHAR(255) DEFAULT NULL,
        creator_id BIGINT DEFAULT NULL,
        is_public TINYINT(1) NOT NULL DEFAULT 1,
        status ENUM('active', 'archived', 'deleted') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS circle_members (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        circle_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_circle_member (circle_id, user_id),
        INDEX idx_circle_id (circle_id),
        INDEX idx_user_id (user_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        type ENUM('online', 'offline') NOT NULL DEFAULT 'offline',
        start_time DATETIME NOT NULL,
        location VARCHAR(255) DEFAULT NULL,
        capacity INT NOT NULL DEFAULT 0,
        signup_deadline DATETIME DEFAULT NULL,
        description TEXT DEFAULT NULL,
        cover_url VARCHAR(255) DEFAULT NULL,
        creator_id BIGINT DEFAULT NULL,
        status ENUM('draft', 'published', 'cancelled', 'finished') NOT NULL DEFAULT 'published',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        event_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        status ENUM('registered', 'cancelled') NOT NULL DEFAULT 'registered',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_event_registration (event_id, user_id),
        INDEX idx_event_id (event_id),
        INDEX idx_user_id (user_id)
      )
    `)
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        circle_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        status ENUM('active', 'deleted') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_circle_id (circle_id),
        INDEX idx_user_id (user_id)
      )
    `)
  } finally {
    await connection.end()
  }
}

pool.ensureDatabaseReady = ensureDatabaseReady

module.exports = pool