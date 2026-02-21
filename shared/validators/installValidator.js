import Joi from 'joi'

/**
 * 安装初始化校验
 */
export const installSchema = Joi.object({
  // 管理员账号
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': '用户名至少 3 个字符',
    'string.max': '用户名最多 30 个字符',
    'any.required': '请填写管理员用户名'
  }),
  // 管理员密码
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少 6 个字符',
    'any.required': '请填写管理员密码'
  }),
  // 网站标题
  siteTitle: Joi.string().allow('').max(200).default(''),
  // 网站副标题
  siteSubTitle: Joi.string().allow('').max(200).default(''),
  // 站点地址
  siteUrl: Joi.string().allow('').max(500).default('')
})
