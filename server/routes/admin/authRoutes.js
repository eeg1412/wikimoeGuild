import { Router } from 'express'
import * as authController from '../../controllers/admin/authController.js'
import { authAdmin } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { loginSchema, changePasswordSchema } from 'shared'

const router = Router()

// 管理员登录
router.post('/login', validate(loginSchema), authController.login)

// 获取管理员信息（需鉴权）
router.get('/profile', authAdmin, authController.getProfile)

// 修改管理员自身密码（需鉴权）
router.put(
  '/password',
  authAdmin,
  validate(changePasswordSchema),
  authController.changePassword
)

export default router
