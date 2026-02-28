import { Router } from 'express'
import * as arenaController from '../../controllers/game/arenaController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

// 竞技场信息
router.get('/info', authPlayer, arenaController.getArenaInfo)

// 报名
router.post('/register', authPlayer, arenaController.registerArena)

// 更新阵容位置
router.put('/formation', authPlayer, arenaController.updateFormationPosition)

// 获取竞技场阵容详情
router.get('/formation', authPlayer, arenaController.getArenaFormation)

// 获取对手列表
router.get('/match-list', authPlayer, arenaController.getMatchList)

// 挑战对手
router.post('/challenge', authPlayer, arenaController.challengeOpponent)

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
