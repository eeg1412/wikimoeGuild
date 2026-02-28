import { Router } from 'express'
import * as mineController from '../../controllers/game/mineController.js'
import { authPlayer } from '../../middlewares/auth.js'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../../config/jwtKeys.js'

const router = Router()

/**
 * SSE 专用认证中间件（通过 query 参数传递 token，因为 EventSource 不支持自定义 Header）
 */
function authPlayerSSE(req, res, next) {
  const token = req.query.token
  if (!token) {
    return res.status(401).json({ message: '未授权' })
  }
  try {
    const decoded = jwt.verify(token, jwtKeys.playerSecret)
    if (decoded.tokenType !== 'access') {
      return res.status(401).json({ message: '令牌类型错误' })
    }
    req.player = decoded
    next()
  } catch {
    return res.status(401).json({ message: '令牌无效' })
  }
}

// 矿场列表
router.get('/list', authPlayer, mineController.listMines)

// 挖矿信息（当前次数等）
router.get('/mining-info', authPlayer, mineController.getMiningInfo)

// 矿主收益
router.get('/revenue', authPlayer, mineController.getOwnerRevenue)

// 矿场详情
router.get('/:mineId', authPlayer, mineController.getMineDetail)

// SSE 矿场实时推送（使用 query 参数认证）
router.get('/:mineId/sse', authPlayerSSE, mineController.sseConnect)

// 挖矿（探索格子）
router.post('/:mineId/dig', authPlayer, mineController.digCell)

export default router
