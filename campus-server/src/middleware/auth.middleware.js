const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未登录' })
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    req.user = {
      userId: payload.userId,
      email: payload.email
    }

    next()
  } catch (err) {
    return res.status(401).json({ message: '登录状态已失效' })
  }
}

module.exports = authMiddleware