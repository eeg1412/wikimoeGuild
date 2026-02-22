import { Router } from 'express'
import adminRoutes from './admin/index.js'
import gameRoutes from './game/index.js'

const router = Router()

router.use('/admin', adminRoutes)
router.use('/game', gameRoutes)

export default router
