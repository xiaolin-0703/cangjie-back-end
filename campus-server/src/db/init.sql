CREATE DATABASE IF NOT EXISTS campus_app
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE campus_app;

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
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_used_created (email, used, created_at),
  INDEX idx_expires_at (expires_at)
);

-- ==========================================
-- 任务 5：内容系统 (帖子、评论、点赞、举报)
-- ==========================================

-- 1. 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '发帖人ID',
  content TEXT NOT NULL COMMENT '帖子文字内容',
  images JSON COMMENT '图片链接数组 (使用 JSON 格式存储多图)',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-待审, 1-正常, 2-封禁',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT '所属帖子的ID',
  user_id INT NOT NULL COMMENT '评论人ID',
  parent_id INT DEFAULT NULL COMMENT '父评论ID(用于实现楼中楼回复，可为NULL)',
  content TEXT NOT NULL COMMENT '评论内容',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-待审, 1-正常, 2-封禁',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id) -- 联合主键，防止用户重复点赞
);

-- 4. 举报表
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL COMMENT '举报人的ID',
  target_type VARCHAR(20) NOT NULL COMMENT '举报目标类型 (post, comment, user)',
  target_id INT NOT NULL COMMENT '被举报目标的具体ID',
  reason VARCHAR(255) NOT NULL COMMENT '举报原因描述',
  status TINYINT DEFAULT 0 COMMENT '处理状态: 0-待处理, 1-已处理, 2-已驳回',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
