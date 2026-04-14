const pool = require('../db/db')

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatar_url,
    grade: user.grade,
    department: user.department,
    studentNo: user.student_no,
    phone: user.phone,
    bio: user.bio,
    identityMode: user.identity_mode,
    studentVerified: Boolean(user.student_verified),
    profileCompleted: Boolean(user.profile_completed),
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

async function getMe(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  )

  const user = rows[0]

  if (!user) {
    throw new Error('用户不存在')
  }

  return formatUser(user)
}

async function updateMe(userId, data) {
  const nickname = data.nickname?.trim() || null
  const avatarUrl = data.avatarUrl?.trim() || null
  const grade = data.grade?.trim() || null
  const department = data.department?.trim() || null
  const studentNo = data.studentNo?.trim() || null
  const phone = data.phone?.trim() || null
  const bio = data.bio?.trim() || null

  const profileCompleted = Boolean(nickname && grade && department)

  await pool.query(
    `
    UPDATE users
    SET
      nickname = ?,
      avatar_url = ?,
      grade = ?,
      department = ?,
      student_no = ?,
      phone = ?,
      bio = ?,
      profile_completed = ?,
      updated_at = NOW()
    WHERE id = ?
    `,
    [
      nickname,
      avatarUrl,
      grade,
      department,
      studentNo,
      phone,
      bio,
      profileCompleted ? 1 : 0,
      userId
    ]
  )

  return getMe(userId)
}

module.exports = {
  getMe,
  updateMe
}