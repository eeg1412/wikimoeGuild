import Joi from 'joi'

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
