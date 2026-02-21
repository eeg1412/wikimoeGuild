import { Router } from 'express'
import { authAdmin } from '../../middlewares/auth.js'
import authRoutes from './authRoutes.js'
import globalConfigRoutes from './globalConfigRoutes.js'
// ===GENERATOR_IMPORT===

const router = Router()

router.use('/auth', authRoutes)
router.use('/global-config', authAdmin, globalConfigRoutes)
// ===GENERATOR_ROUTE===

export default router
