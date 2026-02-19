import { Router } from 'express'
import * as authController from '../../controllers/admin/authController.js'
import { authAdmin } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { loginSchema } from 'shared'

const router = Router()

// 管理员登录
router.post('/login', validate(loginSchema), authController.login)

// 获取管理员信息（需鉴权）
router.get('/profile', authAdmin, authController.getProfile)

export default router
