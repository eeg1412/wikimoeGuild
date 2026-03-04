import { Router } from 'express'
import * as arenaSeasonController from '../../controllers/admin/arenaSeasonController.js'
import { validate } from '../../middlewares/validate.js'
import { updateAdminArenaSeasonTimeSchema } from 'shared'

const router = Router()

router.get('/current', arenaSeasonController.getCurrentSeason)
router.put(
  '/current/time',
  validate(updateAdminArenaSeasonTimeSchema),
  arenaSeasonController.updateCurrentSeasonTime
)

export default router
