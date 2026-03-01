import * as dungeonService from '../../services/game/dungeonService.js'

/**
 * 获取地牢信息
 */
export async function getDungeonInfo(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await dungeonService.getDungeonInfo(accountId)
    res.success(result, '获取地牢信息成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 切换地牢
 */
export async function switchDungeon(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await dungeonService.switchDungeon(accountId)
    res.success(result, '切换成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 结算收取水晶
 */
export async function settleCrystals(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await dungeonService.settleCrystals(accountId)
    res.success(result, '收取成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 选择迷宫等级
 */
export async function selectDungeonLevel(req, res, next) {
  try {
    const accountId = req.player.id
    const { level } = req.body
    const result = await dungeonService.selectDungeonLevel(accountId, level)
    res.success(result, '迷宫等级设置成功')
  } catch (error) {
    next(error)
  }
}
