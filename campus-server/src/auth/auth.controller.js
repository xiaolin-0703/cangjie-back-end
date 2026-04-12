const express = require('express')
const router = express.Router()
const authService = require('./auth.service')

// 发送验证码接口
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body
    const result = await authService.sendCode(email)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 验证验证码接口
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body
    const result = await authService.verify(email, code)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router