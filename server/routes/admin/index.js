import { Router } from 'express'
import { authAdmin } from '../../middlewares/auth.js'
import authRoutes from './authRoutes.js'
import globalConfigCategorizedRoutes from './globalConfigCategorizedRoutes.js'
import installRoutes from './installRoutes.js'
import loginLogRoutes from './loginLogRoutes.js'
import adminRoutes from './adminRoutes.js'
// ===GENERATOR_IMPORT===

const router = Router()

router.use('/auth', authRoutes)
router.use('/global-config', authAdmin, globalConfigCategorizedRoutes)
router.use('/login-log', authAdmin, loginLogRoutes)
router.use('/admins', adminRoutes)
router.use('/', installRoutes)
// ===GENERATOR_ROUTE===

export default router
