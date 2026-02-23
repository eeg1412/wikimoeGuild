import { Router } from 'express'
import * as gamePlayerController from '../../controllers/admin/gamePlayerController.js'

const router = Router()

// 玩家列表
router.get('/', gamePlayerController.list)

// 封禁玩家
router.post('/ban', gamePlayerController.banPlayer)

// 修改玩家密码
router.put('/:id/password', gamePlayerController.changePlayerPassword)

// 封禁记录列表
router.get('/ban-logs', gamePlayerController.listBanLogs)

// 删除封禁记录（解除封禁）
router.delete('/ban-logs/:id', gamePlayerController.deleteBanLog)

export default router
