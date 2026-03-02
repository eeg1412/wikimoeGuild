import GamePlayerInventory from '../../models/gamePlayerInventory.js'

/**
 * 获取玩家背包
 */
export async function getMyInventory(req, res, next) {
  try {
    const accountId = req.player.id
    const inventory = await GamePlayerInventory.findOneAndUpdate(
      { account: accountId },
      { $setOnInsert: { account: accountId } },
      { upsert: true, returnDocument: 'after' }
    ).lean()
    // 移除不必要的 account 字段
    delete inventory.account
    res.success(inventory, '获取背包成功')
  } catch (error) {
    next(error)
  }
}
