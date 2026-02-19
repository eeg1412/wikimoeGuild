import jwt from 'jsonwebtoken'
import { jwtKeys } from '../config/jwtKeys.js'
import logger from '../utils/logger.js'
import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 构造 JWT 鉴权中间件
 * @param {'user'|'admin'} type - 密钥类型
 */
function createAuthMiddleware(type) {
  return function (req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_CODE.UNAUTHORIZED).json({
        code: BIZ_CODE.AUTH_FAILED,
        message: '未提供认证令牌'
      })
    }

    const token = authHeader.split(' ')[1]
    const secret = type === 'admin' ? jwtKeys.adminSecret : jwtKeys.userSecret

    try {
      const decoded = jwt.verify(token, secret)
      req.user = decoded
      next()
    } catch (error) {
      logger.warn(`[${type}] Token verification failed:`, error.message)
      return res.status(HTTP_CODE.UNAUTHORIZED).json({
        code: BIZ_CODE.TOKEN_EXPIRED,
        message: '令牌无效或已过期'
      })
    }
  }
}

/** 用户界面鉴权中间件 */
export const authUser = createAuthMiddleware('user')

/** 管理后台鉴权中间件 */
export const authAdmin = createAuthMiddleware('admin')
