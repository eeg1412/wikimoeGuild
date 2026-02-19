import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 创建 Joi 参数校验中间件
 * @param {import('joi').Schema} schema - Joi schema
 * @param {'body'|'query'|'params'} source - 校验来源
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false })
    if (error) {
      const messages = error.details.map(d => d.message).join('; ')
      return res.status(HTTP_CODE.BAD_REQUEST).json({
        code: BIZ_CODE.PARAM_ERROR,
        message: messages
      })
    }
    req[source] = value
    next()
  }
}
