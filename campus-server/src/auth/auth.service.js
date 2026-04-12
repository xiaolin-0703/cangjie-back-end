const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const pool = require('../db/db')

// 临时存验证码（生产环境建议换 Redis）
const codeStore = {}

/**
 * 统一格式化用户对象，返回给前端更清晰
 */
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

/**
 * 判断资料是否补全
 * 你现在先按 nickname + grade + department 这三个字段判断就够了
 */
function checkProfileCompleted(user) {
  return Boolean(
    user.nickname &&
    user.nickname.trim() &&
    user.grade &&
    user.grade.trim() &&
    user.department &&
    user.department.trim()
  )
}

/**
 * 发送验证码
 */
async function sendCode(email) {
  if (!email) {
    throw new Error('邮箱不能为空')
  }

  const normalizedEmail = email.trim().toLowerCase()

  // 校验是否校园邮箱（后续可以改成更严格的学校域名白名单）
  if (!normalizedEmail.endsWith('.edu.cn')) {
    throw new Error('请使用校园邮箱')
  }

  // 生成 6 位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // 存起来，5 分钟后过期
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

/**
 * 验证验证码，登录或注册
 */
async function verify(email, code) {
  if (!email || !code) {
    throw new Error('邮箱和验证码不能为空')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const record = codeStore[normalizedEmail]

  // 检查验证码是否存在且未过期
  if (!record || Date.now() > record.expireAt) {
    throw new Error('验证码已过期，请重新获取')
  }

  // 检查验证码是否正确
  if (record.code !== String(code).trim()) {
    throw new Error('验证码错误')
  }

  // 验证通过，删掉验证码防止重复使用
  delete codeStore[normalizedEmail]

  // 1. 查用户是否已存在
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  )

  let user = rows[0]

  // 2. 不存在就创建新用户
  if (!user) {
    const [result] = await pool.query(
      `
      INSERT INTO users (
        email,
        identity_mode,
        student_verified,
        profile_completed,
        status,
        last_login_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [normalizedEmail, 'real', 0, 0, 'active']
    )

    const [newRows] = await pool.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    )

    user = newRows[0]
  } else {
    // 3. 已存在就更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    )

    // 重新查一次，拿到最新数据
    const [latestRows] = await pool.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [user.id]
    )
    user = latestRows[0]
  }

  // 4. 保险起见，重新计算一次 profile_completed
  const profileCompleted = checkProfileCompleted(user)

  if (profileCompleted !== Boolean(user.profile_completed)) {
    await pool.query(
      'UPDATE users SET profile_completed = ? WHERE id = ?',
      [profileCompleted ? 1 : 0, user.id]
    )

    const [latestRows] = await pool.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [user.id]
    )
    user = latestRows[0]
  }

  // 5. 签发 Token：建议带 userId，不要只放 email
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email
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