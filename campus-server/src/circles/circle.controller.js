const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const circleService = require('./circle.service')

router.get('/hot', authMiddleware, async (req, res) => {
  try {
    const circles = await circleService.getHotCircles(req.user.userId)
    res.json({ circles })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const circles = await circleService.getCircles(req.user.userId)
    res.json({ circles })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const result = await circleService.createCircleByUser(req.user.userId, req.body)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const circle = await circleService.getCircleDetail(req.user.userId, req.params.id)
    res.json(circle)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const result = await circleService.joinCircleByUser(req.user.userId, req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router