const express = require('express')
const router = express.Router()
const userService = require('./user.service')
const authMiddleware = require('../middleware/auth.middleware')

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getMe(req.user.userId)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.userId, req.body)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch('/mode', authMiddleware, async (req, res) => {
  try {
    const user = await userService.updateMode(req.user.userId, req.body.identityMode)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router