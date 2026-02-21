import jwt from 'jsonwebtoken'
import { jwtKeys } from '../config/jwtKeys.js'
import logger from '../utils/logger.js'

/**
 * 构造 JWT 鉴权中间件
 * @param {'player'|'admin'} type - 密钥类型
 */
function createAuthMiddleware(type) {
  return function (req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.unauthorized()
    }

    const token = authHeader.split(' ')[1]
    const secret = type === 'admin' ? jwtKeys.adminSecret : jwtKeys.playerSecret

    try {
      const decoded = jwt.verify(token, secret)
      if (type === 'admin') {
        req.admin = decoded
      } else {
        req.player = decoded
      }
      next()
    } catch (error) {
      logger.warn(`[${type}] Token verification failed:`, error.message)
      return res.tokenExpired()
    }
  }
}

/** 用户界面鉴权中间件 */
export const authPlayer = createAuthMiddleware('player')

/** 管理后台鉴权中间件 */
export const authAdmin = createAuthMiddleware('admin')
