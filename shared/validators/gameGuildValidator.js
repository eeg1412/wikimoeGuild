import Joi from 'joi'

/**
 * 修改公会图标
 */
export const changeGuildLogoSchema = Joi.object({
  logo: Joi.string().required().messages({ 'any.required': '请提供图标数据' })
})

/**
 * 修改公会名
 */
export const changeGuildNameSchema = Joi.object({
  name: Joi.string().min(2).max(20).required().messages({
    'string.min': '公会名至少 2 个字符',
    'string.max': '公会名最多 20 个字符',
    'any.required': '请输入公会名'
  })
})
