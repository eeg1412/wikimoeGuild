import { Router } from 'express'
import * as authController from '../../controllers/game/authController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  playerChangePasswordSchema,
  guestRegisterSchema,
  guestBindEmailSendCodeSchema,
  guestBindEmailSchema,
  sendCodeSchema,
  playerRegisterSchema,
  playerLoginSchema,
  resetPasswordSchema
} from '../../../shared/validators/index.js'

const router = Router()

// 发送验证码（无需登录）
router.post('/send-code', validate(sendCodeSchema), authController.sendCode)

// 注册
router.post(
  '/register',
  validate(playerRegisterSchema),
  authController.register
)

// 登录
router.post('/login', validate(playerLoginSchema), authController.login)

// 刷新 Token
router.post('/refresh', authController.refresh)

// 重置密码
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
)

// 获取当前登录玩家信息（需鉴权）
router.get('/me', authPlayer, authController.getMe)

// 修改密码（需鉴权）
router.post(
  '/change-password',
  authPlayer,
  validate(playerChangePasswordSchema),
  authController.changePassword
)

// 游客模式配置（无需登录）
router.get('/guest-config', authController.getGuestConfig)

// 游客注册（无需登录）
router.post(
  '/guest-register',
  validate(guestRegisterSchema),
  authController.guestRegister
)

// 游客绑定邮箱 - 发送验证码（需鉴权）
router.post(
  '/guest-bind-email/send-code',
  authPlayer,
  validate(guestBindEmailSendCodeSchema),
  authController.guestBindEmailSendCode
)

// 游客绑定邮箱（需鉴权）
router.post(
  '/guest-bind-email',
  authPlayer,
  validate(guestBindEmailSchema),
  authController.guestBindEmail
)

export default router
