import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config/index.js'
import { connectDB } from './config/db.js'
import { initJwtKeys } from './config/jwtKeys.js'
import logger from './utils/logger.js'
import { initIp2location } from './utils/utils.js'
import routes from './routes/index.js'
import { responseHandler } from './middlewares/responseHandler.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { checkInited } from './services/admin/installService.js'
import { initCronJobs } from './config/cron.js'

// import { generateIconAsync } from './utils/utils.js'

// generateIconAsync('62d2a1a2e6b3c8a91f2dad11')

global.$DBinited = false // 全局变量，表示是否已完成初始化

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 生产环境静态资源目录
const CLIENT_DIST = path.resolve(__dirname, './front')

const app = express()

// 内置中间件
// 增加请求体大小限制以支持 base64 编码的大文件（如 Favicon）
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 响应处理中间件
app.use(responseHandler)

// 用户日志
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`)
  next()
})

// 公共资源（uploads）
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, './public/uploads'), {
    fallthrough: false
  })
)
// 公共资源（publicgame）
app.use(
  '/publicgame',
  express.static(path.resolve(__dirname, './publicgame'), {
    fallthrough: false
  })
)

// API 路由
app.use(
  '/api',

  (req, res, next) => {
    if (!global.$DBinited) {
      // 数据库未连接，直接关闭连接（类似 nginx 444）
      return req.socket?.destroy()
    }
    next()
  },
  routes
)

// -- 生产环境：静态资源 & SPA 路由 --
// /install 特殊处理：已安装则 444，未安装则返回前端
app.get('/install', async (req, res) => {
  if (!global.$DBinited) {
    // 数据库未连接，直接关闭连接（类似 nginx 444）
    return req.socket?.destroy()
  }
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
app.get(
  /.*/,
  (req, res, next) => {
    if (!global.$DBinited) {
      // 数据库未连接，直接关闭连接（类似 nginx 444）
      return req.socket?.destroy()
    }
    next()
  },
  (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  }
)

// 全局错误处理
app.use(errorHandler)

// 启动
async function start() {
  // 初始化 JWT 密钥（检查或生成密钥文件）
  initJwtKeys()
  await connectDB()
  initIp2location()
  initCronJobs()
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`)
  })
}

start()
