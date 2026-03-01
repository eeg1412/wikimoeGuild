import { Router } from 'express'
import * as formationController from '../../controllers/game/formationController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { saveFormationSchema } from '../../../shared/validators/index.js'

const router = Router()

router.get('/my', authPlayer, formationController.listMyFormations)
router.get('/:id', authPlayer, formationController.getFormationDetail)
router.post(
  '/save',
  authPlayer,
  validate(saveFormationSchema),
  formationController.saveFormation
)
router.delete('/:slot', authPlayer, formationController.deleteFormation)

export default router
