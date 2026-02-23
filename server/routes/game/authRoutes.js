import { Router } from 'express'
import * as authController from '../../controllers/game/authController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

// 发送验证码（无需登录）
router.post('/send-code', authController.sendCode)

// 注册
router.post('/register', authController.register)

// 登录
router.post('/login', authController.login)

// 刷新 Token
router.post('/refresh', authController.refresh)

// 重置密码
router.post('/reset-password', authController.resetPassword)

// 获取当前登录玩家信息（需鉴权）
router.get('/me', authPlayer, authController.getMe)

export default router
