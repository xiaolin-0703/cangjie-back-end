const express = require('express')
const cors = require('cors')
require('dotenv').config()

const db = require('./db/db')
const authController = require('./auth/auth.controller')
const userController = require('./users/user.controller')
const homeController = require('./home/home.controller')
const circleController = require('./circles/circle.controller')
const eventController = require('./events/event.controller')

console.log('authController =', typeof authController, authController)
console.log('userController =', typeof userController, userController)
console.log('homeController =', typeof homeController, homeController)
console.log('circleController =', typeof circleController, circleController)
console.log('eventController =', typeof eventController, eventController)

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.use('/auth', authController)
app.use('/users', userController)
app.use('/home', homeController)
app.use('/circles', circleController)
app.use('/events', eventController)
const circlController = require('./circles/circle.controller')
app.use('/circles', circlController)

async function start() {
  try {
    await db.ensureDatabaseReady()
    app.listen(PORT, () => {
      console.log(`后端运行中：http://localhost:${PORT}`)
      console.log('数据库连接成功，服务启动成功')
    })
  } catch (err) {
    console.error('服务启动失败:', err.message)
    process.exit(1)
  }
}

start()