import { Router } from 'express'
import * as loginLogController from '../../controllers/admin/loginLogController.js'

const router = Router()

// 获取登录历史列表（需鉴权，由外层 authAdmin 中间件保护）
router.get('/', loginLogController.list)

export default router
