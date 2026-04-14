const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const userService = require('./user.service')

// 获取当前用户
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getMe(req.user.userId)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 更新当前用户资料
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.updateMe(req.user.userId, req.body)
    res.json({
      message: '资料更新成功',
      user
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router