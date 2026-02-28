import { Router } from 'express'
import * as dungeonController from '../../controllers/game/dungeonController.js'
import * as battleController from '../../controllers/game/battleController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

router.get('/info', authPlayer, dungeonController.getDungeonInfo)
router.post('/switch', authPlayer, dungeonController.switchDungeon)
router.post('/settle', authPlayer, dungeonController.settleCrystals)

// 军团战
router.get('/legion/preview', authPlayer, battleController.previewLegion)
router.post('/legion/challenge', authPlayer, battleController.challengeLegion)

export default router
