import logger from '../utils/logger.js'
import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 全局错误处理中间件
 */
export function errorHandler(err, _req, res, _next) {
  logger.error(err.message, { stack: err.stack })

  const statusCode = err.statusCode || HTTP_CODE.INTERNAL_ERROR
  const bizCode = err.bizCode || BIZ_CODE.SERVER_ERROR
  const message = err.expose ? err.message : '服务器内部错误'

  res.status(statusCode).json({
    code: bizCode,
    message
  })
}
