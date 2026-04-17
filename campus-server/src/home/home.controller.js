const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const homeService = require('./home.service')

router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const result = await homeService.getHomeFeed(req.user.userId)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router