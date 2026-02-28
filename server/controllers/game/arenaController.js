import * as arenaService from '../../services/game/arenaService.js'

export async function getArenaInfo(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await arenaService.getArenaInfo(accountId)
    res.success(result, '获取竞技场信息成功')
  } catch (error) {
    next(error)
  }
}

export async function registerArena(req, res, next) {
  try {
    const accountId = req.player.id
    const { formationSlot } = req.body
    const slot = parseInt(formationSlot)
    if (isNaN(slot) || slot < 1 || slot > 10) {
      return res.paramError('阵容编号无效，请选择1-10')
    }
    const result = await arenaService.registerArena(accountId, slot)
    res.success(result, '报名成功')
  } catch (error) {
    next(error)
  }
}

export async function updateFormationPosition(req, res, next) {
  try {
    const accountId = req.player.id
    const { grid } = req.body
    // 验证grid是5x5数组
    if (
      !Array.isArray(grid) ||
      grid.length !== 5 ||
      !grid.every(row => Array.isArray(row) && row.length === 5)
    ) {
      return res.paramError('阵容格式无效，必须是5x5的网格')
    }
    // 验证grid中的值为有效ObjectId字符串或null
    for (const row of grid) {
      for (const cell of row) {
        if (
          cell !== null &&
          (typeof cell !== 'string' || !/^[0-9a-fA-F]{24}$/.test(cell))
        ) {
          return res.paramError('阵容中包含无效的冒险家ID')
        }
      }
    }
    const result = await arenaService.updateFormationPosition(accountId, grid)
    res.success(result, '阵容位置更新成功')
  } catch (error) {
    next(error)
  }
}

export async function getMatchList(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await arenaService.getMatchList(accountId)
    res.success(result, '获取对手列表成功')
  } catch (error) {
    next(error)
  }
}

export async function challengeOpponent(req, res, next) {
  try {
    const accountId = req.player.id
    const { opponentId } = req.body
    if (!opponentId) {
      return res.paramError('缺少对手ID')
    }
    const opponentIdStr = String(opponentId)
    // 非NPC对手需要验证ObjectId格式
    if (
      !opponentIdStr.startsWith('npc_') &&
      !/^[0-9a-fA-F]{24}$/.test(opponentIdStr)
    ) {
      return res.paramError('无效的对手ID')
    }
    const result = await arenaService.challengeOpponent(
      accountId,
      opponentIdStr
    )
    res.success(result, '挑战完成')
  } catch (error) {
    next(error)
  }
}

export async function getMyBattleLogs(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize } = req.query
    const result = await arenaService.getMyBattleLogs(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20
    })
    res.success(result, '获取战斗记录成功')
  } catch (error) {
    next(error)
  }
}

export async function getBattleLogDetail(req, res, next) {
  try {
    const accountId = req.player.id
    const { logId } = req.params
    if (!logId || !/^[0-9a-fA-F]{24}$/.test(logId)) {
      return res.paramError('无效的记录ID')
    }
    const result = await arenaService.getBattleLogDetail(accountId, logId)
    res.success(result, '获取战斗记录详情成功')
  } catch (error) {
    next(error)
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const { page, pageSize } = req.query
    const result = await arenaService.getLeaderboard({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20
    })
    res.success(result, '获取排行榜成功')
  } catch (error) {
    next(error)
  }
}
