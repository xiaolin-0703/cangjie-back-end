const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const pool = require('../db/db')
const {
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  updateLastLoginAt,
} = require('../users/user.repository')

const verificationCodeMemoryStore = new Map()
const DEV_LOGIN_BYPASS = String(process.env.DEV_LOGIN_BYPASS || '').toLowerCase() === 'true'

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

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })
}

async function markAllCodesUsed(email, conn = pool) {
  await conn.query(
    'UPDATE email_verification_codes SET used = 1 WHERE email = ? AND used = 0',
    [email]
  )
}

async function createVerificationCode(email, code) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()
    await markAllCodesUsed(email, conn)
    await conn.query(
      `INSERT INTO email_verification_codes (email, code, expires_at, used)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)`,
      [email, code]
    )
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

function rememberVerificationCode(email, code) {
  verificationCodeMemoryStore.set(email, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
}

function readMemoryVerificationCode(email) {
  const record = verificationCodeMemoryStore.get(email)
  if (!record) {
    return null
  }

  if (Date.now() > record.expiresAt) {
    verificationCodeMemoryStore.delete(email)
    return null
  }

  return record
}

function clearMemoryVerificationCode(email) {
  verificationCodeMemoryStore.delete(email)
}

async function findLatestValidCode(email) {
  const [rows] = await pool.query(
    `SELECT *
       FROM email_verification_codes
      WHERE email = ? AND used = 0
      ORDER BY id DESC
      LIMIT 1`,
    [email]
  )

  return rows[0] || null
}

async function sendCode(email) {
  const normalizedEmail = normalizeCampusEmail(email)
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  await createVerificationCode(normalizedEmail, code)
  rememberVerificationCode(normalizedEmail, code)

  console.log(`[auth.sendCode] 已生成验证码: ${normalizedEmail} -> ${code}`)

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: normalizedEmail,
      subject: '学生兴趣圈子 — 登录验证码',
      text: `你的验证码是 ${code}，5分钟内有效，请勿泄露。`,
    })
    console.log(`[auth.sendCode] 邮件发送成功: ${normalizedEmail}`)
  } catch (err) {
    console.error(`[auth.sendCode] 邮件发送失败，已保留验证码用于本地调试: ${normalizedEmail}`, err.message)
  }

  return {
    message: '验证码已发送',
    email: normalizedEmail,
  }
}

async function ensureLoginUser(normalizedEmail) {
  let user = await findUserByEmail(normalizedEmail)
  let isFirstLogin = false

  if (!user) {
    isFirstLogin = true
    user = await createUser({
      email: normalizedEmail,
      nickname: null,
      identityMode: 'real',
      profileCompleted: false,
      status: 'active',
    })
  } else {
    if (user.status === 'banned') {
      throw new Error('账号已被封禁，无法登录')
    }

    if (user.status === 'deleted') {
      throw new Error('账号不存在或已注销')
    }

    await updateLastLoginAt(user.id)
  }

  user = await findUserByEmail(normalizedEmail)

  if (!user.nickname || !String(user.nickname).trim()) {
    user = await updateUser(user.id, {
      nickname: generateDefaultNickname(),
    })
  }

  const profileCompleted = checkProfileCompleted(user)

  if (profileCompleted !== Boolean(user.profileCompleted)) {
    user = await updateUser(user.id, {
      profileCompleted,
    })
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return {
    message: '登录成功',
    token,
    user,
    needProfileCompletion: !Boolean(user.profileCompleted),
    nextPage: user.profileCompleted ? 'home' : 'profile',
    isFirstLogin,
  }
}

async function verify(email, code) {
  if (!email || !code) {
    throw new Error('邮箱和验证码不能为空')
  }

  const normalizedEmail = normalizeCampusEmail(email)
  const normalizedCode = String(code).trim()
  let record = await findLatestValidCode(normalizedEmail)
  const memoryRecord = readMemoryVerificationCode(normalizedEmail)

  console.log(
    `[auth.verify] 开始校验: ${normalizedEmail}, db=${record ? record.code : 'none'}, memory=${memoryRecord ? memoryRecord.code : 'none'}, input=${normalizedCode}`
  )

  if (!record && !memoryRecord) {
    if (DEV_LOGIN_BYPASS) {
      console.warn(`[auth.verify] DEV_LOGIN_BYPASS 已开启，直接放行: ${normalizedEmail}`)
      return ensureLoginUser(normalizedEmail)
    }
    console.error('[auth.verify] 未查到可用验证码:', normalizedEmail)
    throw new Error('请先获取验证码')
  }

  if (record) {
    const expiresAt = new Date(record.expires_at).getTime()
    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      await pool.query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [record.id])
      clearMemoryVerificationCode(normalizedEmail)
      throw new Error('验证码已过期，请重新获取')
    }

    if (record.code !== normalizedCode) {
      throw new Error('验证码错误')
    }

    await pool.query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [record.id])
    clearMemoryVerificationCode(normalizedEmail)
    return ensureLoginUser(normalizedEmail)
  }

  if (memoryRecord.code !== normalizedCode) {
    throw new Error('验证码错误')
  }

  clearMemoryVerificationCode(normalizedEmail)
  return ensureLoginUser(normalizedEmail)
}

module.exports = {
  sendCode,
  verify,
}
