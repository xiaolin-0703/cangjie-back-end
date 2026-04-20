const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const userService = require('./user.service')


router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getMe(req.user.userId)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

async function handleUpdateMe(req, res) {
  try {
    const result = await userService.updateProfile(req.user.userId, req.body)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

router.put('/me', authMiddleware, handleUpdateMe)
router.patch('/me', authMiddleware, handleUpdateMe)
router.post('/me/update', authMiddleware, handleUpdateMe)

router.post('/student-auth', authMiddleware, async (req, res) => {
  try {
    const user = await userService.submitAuth(req.user.userId, req.body)
    res.json({
      message: '学生认证申请已提交，等待审核',
      user,
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
