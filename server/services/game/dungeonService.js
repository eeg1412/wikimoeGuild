import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import { executeInLock } from '../../utils/utils.js'
import * as runeStoneService from './runeStoneService.js'
import * as mineService from './mineService.js'

/**
 * 获取地牢信息
 */
export async function getDungeonInfo(accountId) {
  const playerInfo = await GamePlayerInfo.findOne({ account: accountId }).lean()
  if (!playerInfo) {
    const err = new Error('玩家信息不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 计算当前可切换次数（每小时恢复1次，最多24次）
  const now = new Date()
  const lastRecover = new Date(playerInfo.lastMapRecoverAt || now)
  const hoursPassed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
  const recoveredUses = Math.min(playerInfo.mapCanChangeUses + hoursPassed, 24)

  // 计算当前产出
  const lastSettle = new Date(playerInfo.lastDungeonSettleAt || now)
  const minutesPassed = Math.floor((now - lastSettle) / 60000)

  return {
    dungeonsLevel: playerInfo.dungeonsLevel,
    dungeonsBackgroundId: playerInfo.dungeonsBackgroundId,
    dungeonsCryRates: playerInfo.dungeonsCryRates,
    mapCanChangeUses: recoveredUses,
    lastMapRecoverAt: playerInfo.lastMapRecoverAt,
    lastDungeonSettleAt: playerInfo.lastDungeonSettleAt,
    lastBattleAt: playerInfo.lastBattleAt,
    adventurerCount: playerInfo.adventurerCount,
    currentOutput: minutesPassed,
    gold: playerInfo.gold
  }
}

/**
 * 切换地牢
 * 3秒CD，消耗1次切换机会，重新随机水晶爆率
 */
export async function switchDungeon(accountId) {
  return await executeInLock(`dungeon:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    // 先结算恢复的次数
    const now = new Date()
    const lastRecover = new Date(playerInfo.lastMapRecoverAt || now)
    const hoursPassed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
    if (hoursPassed > 0) {
      playerInfo.mapCanChangeUses = Math.min(
        playerInfo.mapCanChangeUses + hoursPassed,
        24
      )
      playerInfo.lastMapRecoverAt = new Date(
        lastRecover.getTime() + hoursPassed * 60 * 60 * 1000
      )
    }

    // 检查切换次数
    if (playerInfo.mapCanChangeUses <= 0) {
      const err = new Error('切换次数不足，请等待恢复')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 先结算当前地牢的水晶
    await settleCrystalsInternal(playerInfo, accountId)

    // 扣除切换次数
    playerInfo.mapCanChangeUses -= 1

    // 随机新的水晶爆率（总和为10000）
    const rates = randomCryRates()
    playerInfo.dungeonsCryRates = rates

    // 随机新的地牢背景
    playerInfo.dungeonsBackgroundId = Math.floor(Math.random() * 5) + 1

    // 重置结算时间
    playerInfo.lastDungeonSettleAt = now

    await playerInfo.save()

    // 尝试发现矿场
    let discoveredMine = null
    try {
      discoveredMine = await mineService.tryDiscoverMine(
        accountId,
        playerInfo.dungeonsLevel,
        rates
      )
    } catch {
      // 矿场发现失败不影响主流程
    }

    return {
      dungeonsCryRates: rates,
      dungeonsBackgroundId: playerInfo.dungeonsBackgroundId,
      mapCanChangeUses: playerInfo.mapCanChangeUses,
      discoveredMine: discoveredMine
        ? {
            _id: discoveredMine._id,
            level: discoveredMine.level,
            ownerGuildName: discoveredMine.ownerGuildName
          }
        : null
    }
  })
}

/**
 * 随机生成水晶爆率（总和10000）
 */
function randomCryRates() {
  // 随机4个值，归一化到10000
  const raw = [Math.random(), Math.random(), Math.random(), Math.random()]
  const total = raw.reduce((s, v) => s + v, 0)
  const rates = raw.map(v => Math.floor((v / total) * 10000))

  // 修正误差
  const diff = 10000 - rates.reduce((s, v) => s + v, 0)
  rates[0] += diff

  return {
    attackCryRate: rates[0],
    defenseCryRate: rates[1],
    speedCryRate: rates[2],
    SANCryRate: rates[3]
  }
}

/**
 * 结算水晶（内部函数，不加锁）
 */
async function settleCrystalsInternal(playerInfo, accountId) {
  const now = new Date()
  const lastSettle = new Date(playerInfo.lastDungeonSettleAt || now)
  const minutesPassed = Math.floor((now - lastSettle) / 60000)

  if (minutesPassed < 1) return { crystals: {}, runeStone: null }

  // 产出率：adventurerCount * 100% + (adventurerCount-1) * 10%，最大2750%
  const cnt = playerInfo.adventurerCount || 0
  if (cnt <= 0) return { crystals: {}, runeStone: null }

  const productionRate = Math.min(cnt * 100 + (cnt - 1) * 10, 2750)
  const totalOutput = Math.floor((minutesPassed * productionRate) / 100)

  if (totalOutput <= 0) return { crystals: {}, runeStone: null }

  // 按爆率分配水晶
  const rates = playerInfo.dungeonsCryRates || {
    attackCryRate: 2500,
    defenseCryRate: 2500,
    speedCryRate: 2500,
    SANCryRate: 2500
  }

  const attackCrystals = Math.floor((totalOutput * rates.attackCryRate) / 10000)
  const defenseCrystals = Math.floor(
    (totalOutput * rates.defenseCryRate) / 10000
  )
  const speedCrystals = Math.floor((totalOutput * rates.speedCryRate) / 10000)
  const sanCrystals = Math.floor((totalOutput * rates.SANCryRate) / 10000)

  // 增加水晶
  await GamePlayerInventory.findOneAndUpdate(
    { account: accountId },
    {
      $inc: {
        attackCrystal: attackCrystals,
        defenseCrystal: defenseCrystals,
        speedCrystal: speedCrystals,
        sanCrystal: sanCrystals
      }
    },
    { upsert: true, returnDocument: 'after' }
  )

  // 尝试掉落符文石（根据水晶总数随机）
  let droppedRuneStone = null
  const totalCrystals =
    attackCrystals + defenseCrystals + speedCrystals + sanCrystals
  // 每个水晶都有一次掉落机会
  for (let i = 0; i < totalCrystals; i++) {
    const dropped = await runeStoneService.tryDropRuneStone(accountId)
    if (dropped) {
      droppedRuneStone = dropped
      break // 一次结算最多掉一个
    }
  }

  return {
    crystals: {
      attackCrystal: attackCrystals,
      defenseCrystal: defenseCrystals,
      speedCrystal: speedCrystals,
      sanCrystal: sanCrystals
    },
    runeStone: droppedRuneStone
  }
}

/**
 * 结算收取水晶（外部接口）
 */
export async function settleCrystals(accountId) {
  return await executeInLock(`dungeon:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const now = new Date()
    const lastSettle = new Date(playerInfo.lastDungeonSettleAt || now)
    const minutesPassed = Math.floor((now - lastSettle) / 60000)

    if (minutesPassed < 1) {
      const err = new Error('距离上次结算不足1分钟')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const result = await settleCrystalsInternal(playerInfo, accountId)

    // 更新结算时间
    playerInfo.lastDungeonSettleAt = now
    await playerInfo.save()

    return result
  })
}
