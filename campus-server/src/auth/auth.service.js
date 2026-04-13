const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const pool = require('../db/db')

// 临时存验证码（生产环境建议换 Redis）
const codeStore = {}

function formatUser(user) {
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

function checkProfileCompleted(user) {
  return Boolean(
    user.nickname &&
    String(user.nickname).trim() &&
    user.grade &&
    String(user.grade).trim() &&
    user.department &&
    String(user.department).trim()
  )
}

function generateDefaultNickname() {
  const suffix = `${Date.now()}`.slice(-6)
  const rand = Math.floor(Math.random() * 90 + 10)
  return `用户${suffix}${rand}`
}

function normalizeCampusEmail(email) {
  if (!email) {
    throw new Error('邮箱不能为空')
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  if (!normalizedEmail.endsWith('.edu.cn')) {
    throw new Error('请使用校园邮箱')
  }

  return normalizedEmail
}

async function findUserById(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  )
  return rows[0]
}

async function sendCode(email) {
  const normalizedEmail = normalizeCampusEmail(email)

  const code = Math.floor(100000 + Math.random() * 900000).toString()

  codeStore[normalizedEmail] = {
    code,
    expireAt: Date.now() + 5 * 60 * 1000
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    }
  })

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: normalizedEmail,
    subject: '学生兴趣圈子 — 登录验证码',
    text: `你的验证码是 ${code}，5分钟内有效，请勿泄露。`
  })

  return { message: '验证码已发送' }
}

async function verify(email, code) {
  if (!email || !code) {
    throw new Error('邮箱和验证码不能为空')
  }

  const normalizedEmail = normalizeCampusEmail(email)
  const record = codeStore[normalizedEmail]

  if (!record || Date.now() > record.expireAt) {
    throw new Error('验证码已过期，请重新获取')
  }

  if (record.code !== String(code).trim()) {
    throw new Error('验证码错误')
  }

  delete codeStore[normalizedEmail]

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  )

  let user = rows[0]

  if (!user) {
    const defaultNickname = generateDefaultNickname()

    const [result] = await pool.query(
      `
      INSERT INTO users (
        email,
        nickname,
        identity_mode,
        student_verified,
        profile_completed,
        status,
        last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [normalizedEmail, defaultNickname, 'real', 0, 0, 'active']
    )

    user = await findUserById(result.insertId)
  } else {
    if (user.status === 'banned') {
      throw new Error('账号已被封禁，无法登录')
    }

    if (user.status === 'deleted') {
      throw new Error('账号不存在或已注销')
    }

    const fields = []
    const values = []

    if (!user.nickname || !String(user.nickname).trim()) {
      fields.push('nickname = ?')
      values.push(generateDefaultNickname())
    }

    fields.push('last_login_at = NOW()')

    values.push(user.id)

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    user = await findUserById(user.id)
  }

  const profileCompleted = checkProfileCompleted(user)

  if (profileCompleted !== Boolean(user.profile_completed)) {
    await pool.query(
      'UPDATE users SET profile_completed = ? WHERE id = ?',
      [profileCompleted ? 1 : 0, user.id]
    )

    user = await findUserById(user.id)
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      status: user.status
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return {
    message: '登录成功',
    token,
    user: formatUser(user),
    needProfileCompletion: !Boolean(user.profile_completed)
  }
}

module.exports = {
  sendCode,
  verify
}