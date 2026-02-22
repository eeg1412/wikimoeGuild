import { Router } from 'express'
import * as adminController from '../../controllers/admin/adminController.js'
import { authAdmin, requireSuperAdmin } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { createAdminSchema, updateAdminSchema } from 'shared'

const router = Router()

// 所有路由均需鉴权且需要 role=999
router.use(authAdmin, requireSuperAdmin)

// 获取管理员列表
router.get('/', adminController.listAdmins)

// 创建管理员
router.post('/', validate(createAdminSchema), adminController.createAdmin)

// 更新管理员
router.put('/:id', validate(updateAdminSchema), adminController.updateAdmin)

export default router
