const pool = require('../db/db')

function formatUser(user) {
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    realName: user.real_name,
    nickname: user.nickname,
    avatarUrl: user.avatar_url,
    grade: user.grade,
    department: user.department,
    studentNo: user.student_no,
    phone: user.phone,
    bio: user.bio,
    identityMode: user.identity_mode,
    studentVerified: Boolean(user.student_verified),
    authStatus: user.auth_status,
    authSubmittedAt: user.auth_submitted_at,
    authReviewedAt: user.auth_reviewed_at,
    authRejectReason: user.auth_reject_reason,
    profileCompleted: Boolean(user.profile_completed),
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

async function findUserById(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  )

  return formatUser(rows[0])
}

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  )

  return formatUser(rows[0])
}

async function createUser(data) {
  const [result] = await pool.query(
    `
    INSERT INTO users (
      email,
      nickname,
      avatar_url,
      grade,
      department,
      identity_mode,
      profile_completed,
      status,
      last_login_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      data.email,
      data.nickname ?? null,
      data.avatarUrl ?? null,
      data.grade ?? null,
      data.department ?? null,
      data.identityMode || 'real',
      data.profileCompleted ? 1 : 0,
      data.status || 'active',
    ]
  )

  return await findUserById(result.insertId)
}

async function updateLastLoginAt(userId) {
  const [result] = await pool.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = ?',
    [userId]
  )

  if (result.affectedRows === 0) {
    return null
  }

  return await findUserById(userId)
}

async function updateUser(userId, data) {
  const fields = []
  const values = []

  if (Object.prototype.hasOwnProperty.call(data, 'nickname')) {
    fields.push('nickname = ?')
    values.push(data.nickname)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'avatarUrl')) {
    fields.push('avatar_url = ?')
    values.push(data.avatarUrl)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'grade')) {
    fields.push('grade = ?')
    values.push(data.grade)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'department')) {
    fields.push('department = ?')
    values.push(data.department)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
    fields.push('phone = ?')
    values.push(data.phone)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'bio')) {
    fields.push('bio = ?')
    values.push(data.bio)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'identityMode')) {
    fields.push('identity_mode = ?')
    values.push(data.identityMode)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'profileCompleted')) {
    fields.push('profile_completed = ?')
    values.push(data.profileCompleted ? 1 : 0)
  }

  if (fields.length === 0) {
    return await findUserById(userId)
  }

  values.push(userId)

  const [result] = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  )

  if (result.affectedRows === 0) {
    return null
  }

  return await findUserById(userId)
}

async function submitStudentAuth(userId, data) {
  const [result] = await pool.query(
    `
    UPDATE users
    SET
      real_name = ?,
      student_no = ?,
      grade = ?,
      department = ?,
      auth_status = 'pending',
      auth_submitted_at = NOW(),
      auth_reviewed_at = NULL,
      auth_reject_reason = NULL
    WHERE id = ?
    `,
    [data.realName, data.studentNo, data.grade, data.department, userId]
  )

  if (result.affectedRows === 0) {
    return null
  }

  return await findUserById(userId)
}

async function listRecommendedUsersForHome(userId, limit = 10) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      email,
      real_name,
      nickname,
      avatar_url,
      grade,
      department,
      student_no,
      phone,
      bio,
      identity_mode,
      student_verified,
      auth_status,
      auth_submitted_at,
      auth_reviewed_at,
      auth_reject_reason,
      profile_completed,
      status,
      last_login_at,
      created_at,
      updated_at
    FROM users
    WHERE id <> ?
      AND status = 'active'
    ORDER BY last_login_at DESC, created_at DESC
    LIMIT ?
    `,
    [userId, limit]
  )

  return rows.map(row => ({
    id: row.id,
    email: row.email,
    realName: row.real_name,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    grade: row.grade,
    department: row.department,
    studentNo: row.student_no,
    phone: row.phone,
    bio: row.bio,
    identityMode: row.identity_mode,
    studentVerified: Boolean(row.student_verified),
    authStatus: row.auth_status,
    authSubmittedAt: row.auth_submitted_at,
    authReviewedAt: row.auth_reviewed_at,
    authRejectReason: row.auth_reject_reason,
    profileCompleted: Boolean(row.profile_completed),
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: [],
    matchRate: 80,
    online: false,
  }))
}


module.exports = {
  findUserById,
  findUserByEmail,
  createUser,
  updateLastLoginAt,
  updateUser,
  submitStudentAuth,
   listRecommendedUsersForHome,
}
