import { Router } from 'express'
import * as runeStoneController from '../../controllers/game/runeStoneController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  runeStonePreviewSynthesisSchema,
  runeStoneConfirmSynthesisSchema
} from '../../../shared/validators/index.js'

const router = Router()

router.get('/my', authPlayer, runeStoneController.listMyRuneStones)
router.get('/:id', authPlayer, runeStoneController.getRuneStoneDetail)
router.post(
  '/:id/decompose',
  authPlayer,
  runeStoneController.decomposeRuneStone
)
router.post('/:id/upgrade', authPlayer, runeStoneController.upgradeRuneStone)

// 符文石合成
router.post(
  '/synthesis/preview',
  authPlayer,
  validate(runeStonePreviewSynthesisSchema),
  runeStoneController.previewSynthesis
)
router.post(
  '/synthesis/confirm',
  authPlayer,
  validate(runeStoneConfirmSynthesisSchema),
  runeStoneController.confirmSynthesis
)

export default router
