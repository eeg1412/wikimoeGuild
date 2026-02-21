import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config/index.js'
import { connectDB } from './config/db.js'
import { initJwtKeys } from './config/jwtKeys.js'
import logger from './utils/logger.js'
import routes from './routes/index.js'
import { responseHandler } from './middlewares/responseHandler.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { checkInited } from './services/admin/installService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 生产环境静态资源目录
const CLIENT_DIST = path.resolve(__dirname, '../front')

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

// 健康检查（放在静态资源之前，不被 catch-all 覆盖）
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// -- 生产环境：静态资源 & SPA 路由 --
// /install 特殊处理：已安装则 444，未安装则返回前端
app.get('/install', async (req, res) => {
  try {
    const inited = await checkInited()
    if (inited) {
      // 444：关闭连接，不返回任何内容
      return req.socket?.destroy()
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  } catch {
    req.socket?.destroy()
  }
})

// 其余前端路由（SPA catch-all）
app.use(express.static(CLIENT_DIST))
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'))
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
