const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authController = require('./auth/auth.controller')

const app = express()
app.use(cors())
app.use(express.json())

// 注册路由
app.use('/auth', authController)

app.listen(process.env.PORT, () => {
  console.log(`后端运行中：http://localhost:${process.env.PORT}`)
})