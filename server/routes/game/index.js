import { Router } from 'express'
import { ipBlockListMiddleware } from '../../middlewares/ipBlockList.js'
import authRoutes from './authRoutes.js'
import configRoutes from './configRoutes.js'
import adventurerRoutes from './adventurerRoutes.js'
import runeStoneRoutes from './runeStoneRoutes.js'
import dungeonRoutes from './dungeonRoutes.js'
import formationRoutes from './formationRoutes.js'
import inventoryRoutes from './inventoryRoutes.js'
import mailRoutes from './mailRoutes.js'
import marketRoutes from './marketRoutes.js'
import arenaRoutes from './arenaRoutes.js'
import mineRoutes from './mineRoutes.js'
import activityRoutes from './activityRoutes.js'
import guildRoutes from './guildRoutes.js'

const router = Router()

// 所有 game 路由均检测 IP 黑名单
router.use(ipBlockListMiddleware)

router.use('/auth', authRoutes)
router.use('/config', configRoutes)
router.use('/adventurers', adventurerRoutes)
router.use('/rune-stones', runeStoneRoutes)
router.use('/dungeon', dungeonRoutes)
router.use('/formations', formationRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/mail', mailRoutes)
router.use('/market', marketRoutes)
router.use('/arena', arenaRoutes)
router.use('/mine', mineRoutes)
router.use('/activity', activityRoutes)
router.use('/guild', guildRoutes)

export default router
