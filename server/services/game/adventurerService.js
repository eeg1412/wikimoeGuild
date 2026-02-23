import GameAdventurer from '../../models/gameAdventurer.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'

/**
 * 获取当前玩家的冒险家列表
 */
export async function listMyAdventurers(accountId) {
  const adventurers = await GameAdventurer.find({ account: accountId })
    .sort({ createdAt: 1 })
    .lean()
  return adventurers
}
