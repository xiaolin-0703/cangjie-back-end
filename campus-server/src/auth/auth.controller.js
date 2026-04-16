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
    
    // 👇 加上这行，看着心里踏实
    console.log(`[auth.controller] 🟢 登录成功响应: ${email}`) 
    
    res.json(result)
  } catch (err) {
    // 👇 顺手把失败日志也加上
    console.error(`[auth.controller] 🔴 登录失败: ${err.message}`) 
    res.status(400).json({ message: err.message })
  }
})

module.exports = router