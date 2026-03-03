import { Router } from 'express'
import * as marketController from '../../controllers/admin/marketController.js'

const router = Router()

// 获取官方市场库存
router.get('/stock', marketController.getOfficialMarketStock)

// 设置官方市场库存
router.put('/stock', marketController.updateOfficialMarketStock)

export default router
