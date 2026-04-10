const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

// 临时存验证码（生产环境换成 Redis）
const codeStore = {}

// 发送验证码
async function sendCode(email) {
  // 校验是否校园邮箱（改成你们学校的域名）
  if (!email.endsWith('.edu.cn')) {
    throw new Error('请使用校园邮箱')
  }

  // 生成6位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // 存起来，5分钟后过期
  codeStore[email] = {
    code,
    expireAt: Date.now() + 5 * 60 * 1000
  }

  // 发邮件
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    }
  })

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: '选课评价社区 — 登录验证码',
    text: `你的验证码是 ${code}，5分钟内有效，请勿泄露。`
  })

  return { message: '验证码已发送' }
}

// 验证验证码，登录或注册
function verify(email, code) {
  const record = codeStore[email]

  // 检查验证码是否存在且未过期
  if (!record || Date.now() > record.expireAt) {
    throw new Error('验证码已过期，请重新获取')
  }

  // 检查验证码是否正确
  if (record.code !== code) {
    throw new Error('验证码错误')
  }

  // 验证通过，删掉验证码防止重复使用
  delete codeStore[email]

  // 签发 Token，7天有效
  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { token }
}

module.exports = { sendCode, verify }