import { Router } from 'express'
import * as guildController from '../../controllers/game/guildController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  changeGuildLogoSchema,
  changeGuildNameSchema
} from '../../../shared/validators/index.js'

const router = Router()

// 修改公会标志
router.post(
  '/logo',
  authPlayer,
  validate(changeGuildLogoSchema),
  guildController.changeGuildLogo
)
// 修改公会名字
router.post(
  '/name',
  authPlayer,
  validate(changeGuildNameSchema),
  guildController.changeGuildName
)

export default router
