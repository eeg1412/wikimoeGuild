import Joi from 'joi'

// 邮箱公用校验规则
const playerEmail = Joi.string().email().max(128).messages({
  'string.email': '邮箱格式不正确',
  'string.max': '邮箱最多 128 个字符'
})

// 密码强度校验规则（至少6位，包含大小写字母、数字）
const playerPassword = Joi.string()
  .min(6)
  .max(64)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .messages({
    'string.min': '密码至少 6 个字符',
    'string.max': '密码最多 64 个字符',
    'string.pattern.base': '密码必须包含大小写字母和数字'
  })

/**
 * 发送验证码校验规则
 */
export const sendCodeSchema = Joi.object({
  email: playerEmail.required().messages({ 'any.required': '请输入邮箱' }),
  type: Joi.string()
    .valid('register', 'reset')
    .default('register')
    .messages({ 'any.only': '无效的验证码类型' })
})

/**
 * 玩家注册校验规则
 */
export const playerRegisterSchema = Joi.object({
  email: playerEmail.required().messages({ 'any.required': '请输入邮箱' }),
  password: playerPassword.required().messages({
    'any.required': '请输入密码'
  }),
  guildName: Joi.string().trim().min(2).max(20).required().messages({
    'any.required': '请输入公会名',
    'string.min': '公会名至少 2 个字符',
    'string.max': '公会名最多 20 个字符'
  }),
  code: Joi.string().length(6).required().messages({
    'any.required': '请输入验证码',
    'string.length': '验证码必须为 6 位'
  })
})

/**
 * 玩家登录校验规则
 */
export const playerLoginSchema = Joi.object({
  email: playerEmail.required().messages({ 'any.required': '请输入邮箱' }),
  password: Joi.string().required().messages({
    'any.required': '请输入密码'
  }),
  rememberMe: Joi.boolean().default(false)
})

/**
 * 重置密码校验规则
 */
export const resetPasswordSchema = Joi.object({
  email: playerEmail.required().messages({ 'any.required': '请输入邮箱' }),
  code: Joi.string().length(6).required().messages({
    'any.required': '请输入验证码',
    'string.length': '验证码必须为 6 位'
  }),
  newPassword: playerPassword.required().messages({
    'any.required': '请输入新密码'
  })
})

/**
 * 玩家修改密码校验规则
 */
export const playerChangePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': '请输入当前密码'
  }),
  newPassword: playerPassword.required().messages({
    'any.required': '请输入新密码'
  })
})

/**
 * 游客注册校验规则（无参数）
 */
export const guestRegisterSchema = Joi.object({})

/**
 * 游客绑定邮箱 - 发送验证码
 */
export const guestBindEmailSendCodeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': '请输入邮箱',
    'string.email': '邮箱格式不正确'
  })
})

/**
 * 游客绑定邮箱
 */
export const guestBindEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': '请输入邮箱',
    'string.email': '邮箱格式不正确'
  }),
  code: Joi.string().length(6).required().messages({
    'any.required': '请输入验证码',
    'string.length': '验证码必须为 6 位'
  })
})
