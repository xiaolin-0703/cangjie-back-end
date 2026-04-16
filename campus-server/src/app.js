const express = require('express')
const cors = require('cors')
require('dotenv').config()

const db = require('./db/db')
const authController = require('./auth/auth.controller')
const userController = require('./users/user.controller')

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    message: 'ok',
    service: 'campus-server',
    time: new Date().toISOString(),
  })
})

app.use('/auth', authController)
app.use('/users', userController)

async function start() {
  try {
    await db.ensureDatabaseReady()
    app.listen(PORT, () => {
      console.log(`后端运行中：http://localhost:${PORT}`)
      console.log('数据库与表结构已就绪')
    })
  } catch (err) {
    console.error('服务启动失败:', err.message)
    process.exit(1)
  }
}

start()
