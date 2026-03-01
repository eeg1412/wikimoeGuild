import { Router } from 'express'
import * as arenaController from '../../controllers/game/arenaController.js'
import { authPlayer } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  arenaRegisterSchema,
  arenaFormationUpdateSchema,
  arenaChallengeSchema
} from '../../../shared/validators/index.js'

const router = Router()

// 竞技场信息
router.get('/info', authPlayer, arenaController.getArenaInfo)

// 报名
router.post(
  '/register',
  authPlayer,
  validate(arenaRegisterSchema),
  arenaController.registerArena
)

// 更新阵容位置
router.put(
  '/formation',
  authPlayer,
  validate(arenaFormationUpdateSchema),
  arenaController.updateFormationPosition
)

// 获取竞技场阵容详情
router.get('/formation', authPlayer, arenaController.getArenaFormation)

// 获取对手列表
router.get('/match-list', authPlayer, arenaController.getMatchList)

// 挑战对手
router.post(
  '/challenge',
  authPlayer,
  validate(arenaChallengeSchema),
  arenaController.challengeOpponent
)

// 我的战斗记录
router.get('/battle-logs', authPlayer, arenaController.getMyBattleLogs)

// 战斗记录详情
router.get(
  '/battle-logs/:logId',
  authPlayer,
  arenaController.getBattleLogDetail
)

// 排行榜
router.get('/leaderboard', arenaController.getLeaderboard)

export default router
