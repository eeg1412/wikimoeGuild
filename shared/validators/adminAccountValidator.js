import Joi from 'joi'

// 密码强度校验规则（可复用）
const strongPassword = Joi.string()
  .min(6)
  .max(128)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
  .messages({
    'string.min': '密码至少 6 个字符',
    'string.max': '密码最多 128 个字符',
    'string.pattern.base': '密码必须包含大小写字母、数字和符号'
  })

/**
 * 用户注册校验规则
 */
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).max(128).required(),
  email: Joi.string().email()
})

/**
 * 用户登录校验规则
 */
export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().default(false)
})

/**
 * 管理员修改自身密码校验规则
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': '请输入当前密码'
  }),
  newPassword: strongPassword.required().messages({
    'any.required': '请输入新密码'
  })
})

/**
 * 超级管理员创建管理员账户校验规则（role 固定为 990）
 */
export const createAdminSchema = Joi.object({
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
  password: strongPassword.required()
})

/**
 * 超级管理员更新管理员账户校验规则
 */
export const updateAdminSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-z0-9]+$/)
    .messages({
      'string.min': '用户名至少 3 个字符',
      'string.max': '用户名最多 30 个字符',
      'string.pattern.base': '用户名只能包含小写字母 (a-z) 和数字 (0-9)'
    }),
  password: strongPassword
})
  .or('username', 'password')
  .messages({
    'object.missing': '至少需要提供用户名或密码中的一项'
  })
