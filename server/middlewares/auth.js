import jwt from 'jsonwebtoken'
import { jwtKeys } from '../config/jwtKeys.js'
import adminAccount from '../models/adminAccounts.js'
import logger from '../utils/logger.js'

/**
 * 构造 JWT 鉴权中间件（仅接受 accessToken）
 * 管理员每次调用接口都会校验 tokenVersion，确保密码修改或封禁后立即失效。
 * 玩家的 tokenVersion 仅在刷新 token 时校验。
 * @param {'player'|'admin'} type - 密钥类型
 */
function createAuthMiddleware(type) {
  return async function (req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.unauthorized()
    }

    const token = authHeader.split(' ')[1]
    const secret = type === 'admin' ? jwtKeys.adminSecret : jwtKeys.playerSecret

    try {
      const decoded = jwt.verify(token, secret)

      // 必须是 accessToken，拒绝 refreshToken 访问普通接口
      if (decoded.tokenType !== 'access') {
        return res.tokenExpired('令牌类型错误')
      }

      if (type === 'admin') {
        // 管理员：每次请求都校验 tokenVersion
        // 使用 ?? 0 兜底，防止旧文档 tokenVersion 字段缺失时 lean() 返回 undefined
        const account = await adminAccount
          .findById(decoded.id)
          .select('tokenVersion')
          .lean()
        if (
          !account ||
          (account.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)
        ) {
          return res.tokenExpired('令牌已失效，请重新登录')
        }
        req.admin = decoded
      } else {
        // 玩家：tokenVersion 仅在 refresh 时校验
        req.player = decoded
      }

      next()
    } catch (error) {
      logger.warn(`[${type}] Token verification failed:`, error.message)
      return res.tokenExpired()
    }
  }
}

/** 玩家端接口鉴权中间件 */
export const authPlayer = createAuthMiddleware('player')

/** 管理后台接口鉴权中间件 */
export const authAdmin = createAuthMiddleware('admin')

/**
 * 超级管理员权限中间件（role=999），需在 authAdmin 之后使用
 */
export function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 999) {
    return res.forbidden('权限不足，需要超级管理员权限')
  }
  next()
}
