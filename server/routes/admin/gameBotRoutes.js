import { Router } from 'express'
import * as gameBotController from '../../controllers/admin/gameBotController.js'
import { validate } from '../../middlewares/validate.js'
import {
  createBotSchema,
  updateBotSchema,
  updateBotGuildNameSchema,
  updateBotGuildIconSchema,
  updateBotAdventurerNameSchema,
  updateBotAdventurerAvatarSchema
} from 'shared'

const router = Router()

// 机器人列表
router.get('/', gameBotController.list)

// 机器人详情
router.get('/:id', gameBotController.getDetail)

// 创建机器人
router.post('/', validate(createBotSchema), gameBotController.create)

// 更新机器人
router.put('/:id', validate(updateBotSchema), gameBotController.update)

// 修改公会名
router.put(
  '/:id/guild-name',
  validate(updateBotGuildNameSchema),
  gameBotController.updateGuildName
)

// 修改公会图标
router.put(
  '/:id/guild-icon',
  validate(updateBotGuildIconSchema),
  gameBotController.updateGuildIcon
)

// 修改冒险家名字
router.put(
  '/:id/adventurer-name',
  validate(updateBotAdventurerNameSchema),
  gameBotController.updateAdventurerName
)

// 修改冒险家头像
router.put(
  '/:id/adventurer-avatar',
  validate(updateBotAdventurerAvatarSchema),
  gameBotController.updateAdventurerAvatar
)

// 手动触发行动
router.post('/:id/trigger', gameBotController.triggerAction)

export default router
