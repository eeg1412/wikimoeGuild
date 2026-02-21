import { Router } from 'express'
import * as installController from '../../controllers/admin/installController.js'
import { validate } from '../../middlewares/validate.js'
import { installSchema } from 'shared'

const router = Router()

// 检查是否已完成初始化
router.get('/check-inited', installController.checkInited)

// 执行站点初始化（若已安装则 444）
router.post('/install', validate(installSchema), installController.install)

export default router
