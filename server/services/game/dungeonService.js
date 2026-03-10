import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import { executeInLock } from '../../utils/utils.js'
import * as runeStoneService from './runeStoneService.js'
import * as mineService from './mineService.js'
import {
  getCrystalProductionRateCap,
  getDungeonLevelBonus,
  getDungeonLevelBonusCap
} from 'shared/utils/guildLevelUtils.js'

// 符文石稀有度排序权重（用于品质比较，值越大越好）
const RUNE_RARITY_ORDER = { legendary: 3, rare: 2, normal: 1 }

/**
 * 计算实际产出率（冒险家产出率 + 迷宫等级增益，受公会等级限制）
 */
function calcProductionRate(playerInfo) {
  const cnt = playerInfo.adventurerCount || 0
  if (cnt <= 0) return 0

  const guildLevel = playerInfo.guildLevel || 1
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const bonusBase = gameSettings.dungeonLevelProductionBonusBase ?? 100

  // 冒险家数量产出率，受公会等级容纳上限限制
  const rateCap = getCrystalProductionRateCap(guildLevel)
  const adventurerRate = Math.min(cnt * 100 + (cnt - 1) * 10, rateCap)

  // 迷宫等级增益（百分比）
  const dungeonLevel = playerInfo.dungeonsLevel || 1
  let dungeonBonus = getDungeonLevelBonus(dungeonLevel, bonusBase)
  // 公会等级上限
  const dungeonBonusCap = getDungeonLevelBonusCap(guildLevel, bonusBase)
  dungeonBonus = Math.min(dungeonBonus, dungeonBonusCap)
  // 减去基础值得到实际增益，确保不为负数
  dungeonBonus = Math.max(dungeonBonus - bonusBase, 0)

  // 两者相加
  return adventurerRate + dungeonBonus
}

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

  // 计算当前产出（基础每分钟1个水晶，乘以产出倍率百分比，上限99999）
  const lastSettle = new Date(playerInfo.lastDungeonSettleAt || now)
  const secondsPassed = Math.floor((now - lastSettle) / 1000)
  const productionRate = calcProductionRate(playerInfo)
  const currentOutput = Math.min(
    Math.floor((secondsPassed * productionRate) / 6000),
    99999
  )

  return {
    dungeonsLevel: playerInfo.dungeonsLevel,
    selectedDungeonsLevel:
      playerInfo.selectedDungeonsLevel || playerInfo.dungeonsLevel,
    dungeonsBackgroundId: playerInfo.dungeonsBackgroundId,
    dungeonsCryRates: playerInfo.dungeonsCryRates,
    mapCanChangeUses: recoveredUses,
    lastMapRecoverAt: playerInfo.lastMapRecoverAt,
    lastDungeonSettleAt: playerInfo.lastDungeonSettleAt,
    lastBattleAt: playerInfo.lastBattleAt,
    adventurerCount: playerInfo.adventurerCount,
    currentOutput: currentOutput,
    gold: playerInfo.gold,
    guildLevel: playerInfo.guildLevel || 1
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
    playerInfo.dungeonsBackgroundId = Math.floor(Math.random() * 11) + 1

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
  const secondsPassed = Math.floor((now - lastSettle) / 1000)

  if (secondsPassed < 1) return { crystals: {}, runeStones: [], discardedRuneStones: { normal: 0, rare: 0, legendary: 0 } }

  const cnt = playerInfo.adventurerCount || 0
  if (cnt <= 0) return { crystals: {}, runeStones: [], discardedRuneStones: { normal: 0, rare: 0, legendary: 0 } }

  // 使用新的产出率计算（包含迷宫等级增益，受公会等级限制）
  const productionRate = calcProductionRate(playerInfo)
  // 基础每分钟产出1个水晶，乘以产出率百分比，向下取整
  const totalOutput = Math.min(
    Math.floor((secondsPassed * productionRate) / 6000),
    99999
  )

  if (totalOutput <= 0) return { crystals: {}, runeStones: [], discardedRuneStones: { normal: 0, rare: 0, legendary: 0 } }

  // 按爆率分配水晶
  const rates = playerInfo.dungeonsCryRates || {
    attackCryRate: 2500,
    defenseCryRate: 2500,
    speedCryRate: 2500,
    SANCryRate: 2500
  }

  // 先按比例 floor 分配（节约算力）
  let attackCrystals = Math.floor((totalOutput * rates.attackCryRate) / 10000)
  let defenseCrystals = Math.floor((totalOutput * rates.defenseCryRate) / 10000)
  let speedCrystals = Math.floor((totalOutput * rates.speedCryRate) / 10000)
  let sanCrystals = Math.floor((totalOutput * rates.SANCryRate) / 10000)

  // 计算 floor 截断后遗漏的水晶数，对每个遗漏水晶单独随机分配
  const remainder =
    totalOutput -
    (attackCrystals + defenseCrystals + speedCrystals + sanCrystals)
  const cumAttack = rates.attackCryRate
  const cumDefense = cumAttack + rates.defenseCryRate
  const cumSpeed = cumDefense + rates.speedCryRate
  for (let i = 0; i < remainder; i++) {
    const roll = Math.floor(Math.random() * 10000)
    if (roll < cumAttack) attackCrystals++
    else if (roll < cumDefense) defenseCrystals++
    else if (roll < cumSpeed) speedCrystals++
    else sanCrystals++
  }

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

  // 第一阶段：概率滚算（不写 DB），收集所有潜在掉落
  const totalCrystals =
    attackCrystals + defenseCrystals + speedCrystals + sanCrystals
  // 使用玩家选择的迷宫等级控制符文石产出等级
  const runeStoneLevel =
    playerInfo.selectedDungeonsLevel || playerInfo.dungeonsLevel
  const potentialDrops = []
  for (let i = 0; i < totalCrystals; i++) {
    const drop = runeStoneService.tryDropRuneStoneData(runeStoneLevel)
    if (drop) potentialDrops.push(drop)
  }

  const droppedRuneStones = []
  const discardedRuneStones = { normal: 0, rare: 0, legendary: 0 }

  if (potentialDrops.length > 0) {
    // 查询当前持有数量，计算可用槽位
    const currentCount = await GameRuneStone.countDocuments({
      account: accountId
    })
    const availableSlots = Math.max(0, 500 - currentCount)

    // 按品质降序排列（传说 > 稀有 > 普通，同稀有度按等级降序）
    potentialDrops.sort((a, b) => {
      const rarityDiff =
        (RUNE_RARITY_ORDER[b.rarity] || 0) - (RUNE_RARITY_ORDER[a.rarity] || 0)
      if (rarityDiff !== 0) return rarityDiff
      return b.level - a.level
    })

    const keptDrops = potentialDrops.slice(0, availableSlots)
    const discarded = potentialDrops.slice(availableSlots)

    // 第二阶段：保存保留的符文石
    for (const drop of keptDrops) {
      const stone = await runeStoneService.generateRuneStone(
        accountId,
        drop.rarity,
        drop.level
      )
      droppedRuneStones.push(stone)
    }

    // 统计丢弃数量
    for (const d of discarded) {
      discardedRuneStones[d.rarity] = (discardedRuneStones[d.rarity] || 0) + 1
    }
  }

  return {
    crystals: {
      attackCrystal: attackCrystals,
      defenseCrystal: defenseCrystals,
      speedCrystal: speedCrystals,
      sanCrystal: sanCrystals
    },
    runeStones: droppedRuneStones,
    discardedRuneStones
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
    const secondsPassed = Math.floor((now - lastSettle) / 1000)

    if (secondsPassed < 3) {
      const err = new Error('距离上次结算不足3秒')
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

/**
 * 选择迷宫等级（控制符文石产出等级）
 * 只能选择 1 ~ 当前最高等级的迷宫
 */
export async function selectDungeonLevel(accountId, level) {
  return await executeInLock(`dungeon:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (
      !Number.isInteger(level) ||
      level < 1 ||
      level > playerInfo.dungeonsLevel
    ) {
      const err = new Error(
        `迷宫等级必须在 1 ~ ${playerInfo.dungeonsLevel} 之间`
      )
      err.statusCode = 400
      err.expose = true
      throw err
    }

    playerInfo.selectedDungeonsLevel = level
    await playerInfo.save()

    return { selectedDungeonsLevel: level }
  })
}
