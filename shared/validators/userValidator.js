import Joi from 'joi'

/**
 * 用户注册校验规则
 */
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).max(128).required(),
  email: Joi.string().email().required()
})

/**
 * 用户登录校验规则
 */
export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})
