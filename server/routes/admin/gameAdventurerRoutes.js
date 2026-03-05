import { Router } from 'express'
import * as gameAdventurerController from '../../controllers/admin/gameAdventurerController.js'

const router = Router()

// 冒险家列表
router.get('/', gameAdventurerController.list)

// 修改冒险家名字
router.put('/:id/rename', gameAdventurerController.rename)

// 重置冒险家头像为默认
router.put('/:id/reset-avatar', gameAdventurerController.resetAvatar)

export default router
