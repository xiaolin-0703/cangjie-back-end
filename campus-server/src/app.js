const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authController = require('./auth/auth.controller')
const userController = require('./users/user.controller')

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

<<<<<<< HEAD
=======
app.get('/health', (req, res) => {
  res.json({
    message: 'ok',
    service: 'campus-server',
    time: new Date().toISOString(),
  })
})

// 注册路由
>>>>>>> wz
app.use('/auth', authController)
app.use('/users', userController)

app.listen(PORT, () => {
  console.log(`后端运行中：http://localhost:${PORT}`)
})