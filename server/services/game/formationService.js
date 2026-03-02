import GameFormation from '../../models/gameFormation.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import { executeInLock } from '../../utils/utils.js'

/**
 * 获取玩家的所有阵容
 */
export async function listMyFormations(accountId) {
  const formations = await GameFormation.find({ account: accountId })
    .select('-account')
    .sort({ slot: 1 })
    .lean()
  return formations
}

/**
 * 获取单个阵容详情（含冒险家信息）
 */
export async function getFormationDetail(accountId, formationId) {
  const formation = await GameFormation.findOne({
    _id: formationId,
    account: accountId
  })
    .select('-account')
    .populate({
      path: 'grid',
      model: 'game_adventurer',
      select: '-account',
      populate: { path: 'runeStone', select: '-account' }
    })
    .lean()
  if (!formation) {
    const err = new Error('阵容不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return formation
}

/**
 * 保存阵容
 * @param {string} accountId
 * @param {number} slot - 阵容槽位 1-10
 * @param {string} name - 阵容名称
 * @param {Array<Array<string|null>>} grid - 5x5 棋盘
 */
export async function saveFormation(accountId, slot, name, grid) {
  return await executeInLock(`formation:${accountId}`, async () => {
    if (slot < 1 || slot > 10) {
      const err = new Error('阵容槽位必须在1-10之间')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 验证grid格式
    if (!Array.isArray(grid) || grid.length !== 5) {
      const err = new Error('阵容棋盘格式错误')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    for (const row of grid) {
      if (!Array.isArray(row) || row.length !== 5) {
        const err = new Error('阵容棋盘每行必须有5个位置')
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    // 收集所有非null的冒险家ID
    const adventurerIds = grid.flat().filter(id => id !== null && id !== '')
    const uniqueIds = [...new Set(adventurerIds)]

    // 检查是否有重复的冒险家
    if (adventurerIds.length !== uniqueIds.length) {
      const err = new Error('阵容中不能放置重复的冒险家')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查冒险家数量限制（最多25名）
    if (uniqueIds.length > 25) {
      const err = new Error('阵容最多配置25名冒险家')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 验证冒险家是否属于该玩家
    if (uniqueIds.length > 0) {
      const ownedCount = await GameAdventurer.countDocuments({
        _id: { $in: uniqueIds },
        account: accountId
      })
      if (ownedCount !== uniqueIds.length) {
        const err = new Error('阵容中包含不属于您的冒险家')
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    // 将空字符串转为null
    const cleanGrid = grid.map(row =>
      row.map(cell => (cell === '' ? null : cell))
    )

    // 阵容名称敏感词过滤
    const formationName = name || `阵容${slot}`
    if (
      global.$sensitiveFilter &&
      global.$sensitiveFilter.contains(formationName)
    ) {
      const err = new Error('阵容名称包含敏感词')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 更新或创建阵容
    const formation = await GameFormation.findOneAndUpdate(
      { account: accountId, slot },
      {
        account: accountId,
        slot,
        name: formationName,
        grid: cleanGrid
      },
      { upsert: true, returnDocument: 'after' }
    )
      .select('-account')
      .lean()

    return formation
  })
}

/**
 * 删除阵容
 */
export async function deleteFormation(accountId, slot) {
  const result = await GameFormation.deleteOne({ account: accountId, slot })
  if (result.deletedCount === 0) {
    const err = new Error('阵容不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
}
