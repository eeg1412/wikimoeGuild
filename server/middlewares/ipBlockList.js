import { getUserIp } from '../utils/utils.js'

/**
 * Game 路由 IP 黑名单检测中间件
 * 如果请求 IP 在 siteIPBlockList 中，返回 403
 */
export function ipBlockListMiddleware(req, res, next) {
  const blockList = global.$globalConfig?.securitySettings?.siteIPBlockList
  if (!blockList || blockList.size === 0) {
    return next()
  }
  const ip = getUserIp(req)
  if (blockList.has(ip)) {
    return res
      .status(403)
      .json({ code: 403, message: '您的 IP 已被封禁，禁止访问' })
  }
  next()
}
