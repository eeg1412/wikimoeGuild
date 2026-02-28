import { Router } from 'express'
import * as guildController from '../../controllers/game/guildController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

// 修改公会标志
router.post('/logo', authPlayer, guildController.changeGuildLogo)
// 修改公会名字
router.post('/name', authPlayer, guildController.changeGuildName)

export default router
