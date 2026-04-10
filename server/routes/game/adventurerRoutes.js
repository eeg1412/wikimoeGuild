import { Router } from 'express'
import * as adventurerController from '../../controllers/game/adventurerController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  adventurerCustomAvatarSchema,
  adventurerCustomNameSchema,
  adventurerLevelUpSchema,
  adventurerLevelDownSchema,
  adventurerEquipRuneStoneSchema,
  adventurerRerollSchema,
  adventurerSetRoleTagSchema,
  adventurerBatchEquipBestSchema,
  adventurerSaveDistributeRatioSchema,
  adventurerAutoDistributeLevelUpSchema,
  adventurerBatchRatioDistributeSchema,
  adventurerFormationMaxUpgradeSchema,
  adventurerBatchFixedUpgradeSchema
} from '../../../shared/validators/index.js'

const router = Router()

// 获取我的冒险家列表（需鉴权）
router.get('/my', authPlayer, adventurerController.listMyAdventurers)
// 招募冒险家
router.post('/recruit', authPlayer, adventurerController.recruitAdventurer)
// 批量装备最高级符文石（放在 /:id 之前避免路由匹配冲突）
router.post(
  '/batch-equip-best',
  authPlayer,
  validate(adventurerBatchEquipBestSchema),
  adventurerController.batchEquipBestRuneStones
)
// 批量按比例升降级（放在 /:id 之前避免路由匹配冲突）
router.post(
  '/batch-ratio-distribute',
  authPlayer,
  validate(adventurerBatchRatioDistributeSchema),
  adventurerController.batchRatioDistribute
)
// 批量固定等级升级（支持自动升级公会后继续升级）
router.post(
  '/batch-fixed-upgrade',
  authPlayer,
  validate(adventurerBatchFixedUpgradeSchema),
  adventurerController.batchFixedUpgrade
)
// 按阵容升级到当前资源可达的最高等级（放在 /:id 之前避免路由匹配冲突）
router.post(
  '/formation-max-upgrade',
  authPlayer,
  validate(adventurerFormationMaxUpgradeSchema),
  adventurerController.formationMaxUpgrade
)
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
// 属性降级
router.post(
  '/:id/level-down',
  authPlayer,
  validate(adventurerLevelDownSchema),
  adventurerController.levelDownStat
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
// 设置角色标记
router.post(
  '/:id/role-tag',
  authPlayer,
  validate(adventurerSetRoleTagSchema),
  adventurerController.setRoleTag
)
// 保存属性自动分配比例
router.post(
  '/:id/distribute-ratio',
  authPlayer,
  validate(adventurerSaveDistributeRatioSchema),
  adventurerController.saveDistributeRatio
)
// 自动分配升级
router.post(
  '/:id/auto-distribute-level-up',
  authPlayer,
  validate(adventurerAutoDistributeLevelUpSchema),
  adventurerController.autoDistributeLevelUp
)

export default router
