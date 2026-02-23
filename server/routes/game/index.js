import { Router } from 'express'
import { ipBlockListMiddleware } from '../../middlewares/ipBlockList.js'
import authRoutes from './authRoutes.js'
import configRoutes from './configRoutes.js'
import adventurerRoutes from './adventurerRoutes.js'

const router = Router()

// 所有 game 路由均检测 IP 黑名单
router.use(ipBlockListMiddleware)

router.use('/auth', authRoutes)
router.use('/config', configRoutes)
router.use('/adventurers', adventurerRoutes)

export default router
