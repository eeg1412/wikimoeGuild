import express from 'express'
import config from './config/index.js'
import { connectDB } from './config/db.js'
import { initJwtKeys } from './config/jwtKeys.js'
import logger from './utils/logger.js'
import routes from './routes/index.js'
import { responseHandler } from './middlewares/responseHandler.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

// 内置中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 响应处理中间件
app.use(responseHandler)

// 请求日志
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`)
  next()
})

// API 路由
app.use('/api', routes)

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// 全局错误处理
app.use(errorHandler)

// 启动
async function start() {
  // 初始化 JWT 密钥（检查或生成密钥文件）
  initJwtKeys()
  await connectDB()
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`)
  })
}

start()
