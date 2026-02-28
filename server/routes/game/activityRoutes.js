import { Router } from 'express'
import * as activityController from '../../controllers/game/activityController.js'

const router = Router()

// 获取玩家动态列表（公开接口，无需登录）
router.get('/list', activityController.getActivities)

export default router
