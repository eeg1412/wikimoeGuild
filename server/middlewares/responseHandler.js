import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 响应处理中间件，扩展 res 对象
 */
export const responseHandler = (_req, res, next) => {
  /**
   * 成功响应 (默认为 BIZ_CODE.SUCCESS)
   * @param {any} data - 响应数据
   * @param {string} message - 响应消息
   */
  res.success = (data, message = '操作成功') => {
    res.json({
      code: BIZ_CODE.SUCCESS,
      message,
      data
    })
  }

  /**
   * 创建成功响应 (201 Created)
   * @param {any} data - 响应数据
   * @param {string} message - 响应消息
   */
  res.created = (data, message = '创建成功') => {
    res.status(HTTP_CODE.CREATED).json({
      code: BIZ_CODE.SUCCESS,
      message,
      data
    })
  }

  /**
   * 失败响应
   * @param {number} bizCode - 业务错误码
   * @param {string} message - 响应消息
   * @param {number} httpCode - HTTP 状态码
   */
  res.fail = (
    bizCode,
    message = '操作失败',
    httpCode = HTTP_CODE.BAD_REQUEST
  ) => {
    res.status(httpCode).json({
      code: bizCode,
      message
    })
  }

  /**
   * 参数错误响应 (400 Bad Request)
   */
  res.paramError = (message = '参数错误') => {
    res.fail(BIZ_CODE.PARAM_ERROR, message, HTTP_CODE.BAD_REQUEST)
  }

  /**
   * 未经授权响应 (401 Unauthorized)
   */
  res.unauthorized = (message = '未提供认证令牌') => {
    res.fail(BIZ_CODE.AUTH_FAILED, message, HTTP_CODE.UNAUTHORIZED)
  }

  /**
   * 令牌过期/无效响应 (401 Unauthorized)
   */
  res.tokenExpired = (message = '令牌无效或已过期') => {
    res.fail(BIZ_CODE.TOKEN_EXPIRED, message, HTTP_CODE.UNAUTHORIZED)
  }

  /**
   * 禁止访问响应 (403 Forbidden)
   */
  res.forbidden = (message = '权限不足') => {
    res.fail(BIZ_CODE.AUTH_FAILED, message, HTTP_CODE.FORBIDDEN)
  }

  next()
}
