import { Router } from 'express'
import * as adventurerController from '../../controllers/game/adventurerController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

// 获取我的冒险家列表（需鉴权）
router.get('/my', authPlayer, adventurerController.listMyAdventurers)

export default router
