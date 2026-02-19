import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import { authUser } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { registerSchema, loginSchema } from 'shared'

const router = Router()

// 注册
router.post('/register', validate(registerSchema), userController.register)

// 登录
router.post('/login', validate(loginSchema), userController.login)

// 获取当前用户（需鉴权）
router.get('/profile', authUser, userController.getProfile)

export default router
