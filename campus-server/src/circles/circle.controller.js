const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const circleService = require('./circle.service')

router.get('/hot', authMiddleware, async (req, res) => {
  try {
    const circles = await circleService.getHotCircles()
    res.json({ circles })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const circles = await circleService.getMyCircles(req.user.userId)
    res.json({ circles })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const result = await circleService.joinCircle(req.user.userId, req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router