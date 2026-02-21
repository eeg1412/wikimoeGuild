import Joi from 'joi'

/**
 * 安装初始化校验
 */
export const installSchema = Joi.object({
  // 管理员账号：只能是半角小写字母和数字
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-z0-9]+$/)
    .required()
    .messages({
      'string.min': '用户名至少 3 个字符',
      'string.max': '用户名最多 30 个字符',
      'string.pattern.base': '用户名只能包含小写字母 (a-z) 和数字 (0-9)',
      'any.required': '请填写管理员用户名'
    }),
  // 管理员密码：必须包含大小写字母、数字和符号
  password: Joi.string()
    .min(6)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .required()
    .messages({
      'string.min': '密码至少 6 个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和符号',
      'any.required': '请填写管理员密码'
    }),
  // 网站标题 必填
  siteTitle: Joi.string().min(1).max(200).required().messages({
    'any.required': '请填写网站标题',
    'string.max': '网站标题最多 200 个字符'
  }),
  // 网站副标题
  siteSubTitle: Joi.string().allow('').max(200).default(''),
  // 站点关键词
  siteKeywords: Joi.string().allow('').max(500).default(''),
  // 站点地址 必填
  siteUrl: Joi.string().min(1).max(500).required().messages({
    'any.required': '请填写站点地址',
    'string.max': '站点地址最多 500 个字符'
  })
})
