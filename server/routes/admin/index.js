import { Router } from 'express'
import { authAdmin } from '../../middlewares/auth.js'
import authRoutes from './authRoutes.js'
import globalConfigCategorizedRoutes from './globalConfigCategorizedRoutes.js'
import installRoutes from './installRoutes.js'
import loginLogRoutes from './loginLogRoutes.js'
import adminRoutes from './adminRoutes.js'
import gamePlayerRoutes from './gamePlayerRoutes.js'
import gameMailCodeRoutes from './gameMailCodeRoutes.js'
import gamePlayerLoginLogRoutes from './gamePlayerLoginLogRoutes.js'
import gamePlayerRegisterLogRoutes from './gamePlayerRegisterLogRoutes.js'
import gameAdventurerRoutes from './gameAdventurerRoutes.js'
// ===GENERATOR_IMPORT===

const router = Router()

router.use('/auth', authRoutes)
router.use('/global-config', authAdmin, globalConfigCategorizedRoutes)
router.use('/login-log', authAdmin, loginLogRoutes)
router.use('/admins', adminRoutes)
router.use('/game-players', authAdmin, gamePlayerRoutes)
router.use('/game-mail-codes', authAdmin, gameMailCodeRoutes)
router.use('/game-player-login-logs', authAdmin, gamePlayerLoginLogRoutes)
router.use('/game-player-register-logs', authAdmin, gamePlayerRegisterLogRoutes)
router.use('/game-adventurers', authAdmin, gameAdventurerRoutes)
router.use('/', installRoutes)
// ===GENERATOR_ROUTE===

export default router
