import { Router } from 'express'
import * as configController from '../../controllers/game/configController.js'

const router = Router()

// 获取站点配置（前端 SEO 所需）
router.get('/site-settings', configController.getSiteSettings)

// 获取游戏配置（价格等）
router.get('/game-settings', configController.getGameSettings)

export default router
