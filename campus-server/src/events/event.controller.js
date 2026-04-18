const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const eventService = require('./event.service')

router.get('/featured', authMiddleware, async (req, res) => {
  try {
    const events = await eventService.getFeaturedEvents()
    res.json({ events })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const events = await eventService.getMyEvents(req.user.userId)
    res.json({ events })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/created-by-me', authMiddleware, async (req, res) => {
  try {
    const events = await eventService.getCreatedEvents(req.user.userId)
    res.json({ events })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/:id/registrations', authMiddleware, async (req, res) => {
  try {
    const result = await eventService.getEventRegistrations(req.user.userId, req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const result = await eventService.registerEvent(req.user.userId, req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const result = await eventService.createEvent(req.user.userId, req.body)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router