import logger from '../utils/logger.js'
import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 全局错误处理中间件
 * - expose=true 的业务错误：直接返回，无需写日志（属于预期范围内的用户行为）
 * - 无 expose 或 statusCode >= 500 的系统错误：写入 error.log
 */
export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || HTTP_CODE.INTERNAL_ERROR
  const bizCode = err.bizCode || BIZ_CODE.SERVER_ERROR
  const message = err.expose ? err.message : '服务器内部错误'

  // 只记录系统/代码级错误，业务逻辑错误（expose=true）无需写日志
  if (!err.expose || statusCode >= 500) {
    logger.error(err.message, { stack: err.stack })
  }

  res.status(statusCode).json({
    code: bizCode,
    message
  })
}
