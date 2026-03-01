import { Router } from 'express'
import * as adventurerController from '../../controllers/game/adventurerController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  adventurerCustomAvatarSchema,
  adventurerCustomNameSchema,
  adventurerLevelUpSchema,
  adventurerEquipRuneStoneSchema,
  adventurerRerollSchema
} from '../../../shared/validators/index.js'

const router = Router()

// 获取我的冒险家列表（需鉴权）
router.get('/my', authPlayer, adventurerController.listMyAdventurers)
// 招募冒险家
router.post('/recruit', authPlayer, adventurerController.recruitAdventurer)
// 获取冒险家详情
router.get('/:id', authPlayer, adventurerController.getAdventurerDetail)
// 自定义头像
router.post(
  '/:id/avatar',
  authPlayer,
  validate(adventurerCustomAvatarSchema),
  adventurerController.customizeAvatar
)
// 自定义名字
router.post(
  '/:id/name',
  authPlayer,
  validate(adventurerCustomNameSchema),
  adventurerController.customizeName
)
// 属性升级
router.post(
  '/:id/level-up',
  authPlayer,
  validate(adventurerLevelUpSchema),
  adventurerController.levelUpStat
)
// 装备符文石
router.post(
  '/:id/equip',
  authPlayer,
  validate(adventurerEquipRuneStoneSchema),
  adventurerController.equipRuneStone
)
// 卸下符文石
router.post('/:id/unequip', authPlayer, adventurerController.unequipRuneStone)
// 洗属性（元素/被动增益/攻击偏好）
router.post(
  '/:id/reroll',
  authPlayer,
  validate(adventurerRerollSchema),
  adventurerController.rerollAttribute
)

export default router
