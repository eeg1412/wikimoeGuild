import * as adventurerService from '../../services/game/adventurerService.js'

/**
 * 获取我的冒险家列表
 */
export async function listMyAdventurers(req, res, next) {
  try {
    const accountId = req.player.id
    const adventurers = await adventurerService.listMyAdventurers(accountId)
    res.success(adventurers, '获取冒险家列表成功')
  } catch (error) {
    next(error)
  }
}
