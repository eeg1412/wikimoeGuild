import { Router } from 'express'
import * as dungeonController from '../../controllers/game/dungeonController.js'
import * as battleController from '../../controllers/game/battleController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  dungeonLegionChallengeSchema,
  dungeonSelectLevelSchema
} from '../../../shared/validators/index.js'

const router = Router()

router.get('/info', authPlayer, dungeonController.getDungeonInfo)
router.post('/switch', authPlayer, dungeonController.switchDungeon)
router.post('/settle', authPlayer, dungeonController.settleCrystals)
router.post(
  '/select-level',
  authPlayer,
  validate(dungeonSelectLevelSchema),
  dungeonController.selectDungeonLevel
)

// 军团战
router.get('/legion/preview', authPlayer, battleController.previewLegion)
router.post(
  '/legion/challenge',
  authPlayer,
  validate(dungeonLegionChallengeSchema),
  battleController.challengeLegion
)

export default router
