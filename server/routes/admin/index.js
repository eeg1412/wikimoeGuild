import { Router } from 'express'
import { authAdmin } from '../../middlewares/auth.js'
import authRoutes from './authRoutes.js'
import globalConfigCategorizedRoutes from './globalConfigCategorizedRoutes.js'
import installRoutes from './installRoutes.js'
// ===GENERATOR_IMPORT===

const router = Router()

router.use('/auth', authRoutes)
router.use('/global-config', authAdmin, globalConfigCategorizedRoutes)
router.use('/', installRoutes)
// ===GENERATOR_ROUTE===

export default router
