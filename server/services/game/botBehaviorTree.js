/**
 * 机器人行为树引擎
 *
 * 每个整点执行一次行动树，所有行动直接调用游戏服务层，
 * 确保所有规则约束与真实玩家一致。
 *
 * 行动树执行流程：
 * 1. 资源收集（结算水晶、领取邮件）- 共通行动
 * 2. 出售符文石碎片（碎片换金币）- 共通行动
 * 3. 卖水晶换金币（为招募冒险家和公会升级准备资金）- 共通行动
 * 4. 招募冒险家（优先招募到下次公会升级所需数量，最多25个）- 共通行动
 * 5. 阵容管理（设定冒险家标记，按规则加入阵容）- 共通行动
 * 6. 循环执行（最多3轮，尽可能花完资源）：
 *    a. 购买水晶（智能使用余钱从玩家市场/官方市场购买短缺水晶）
 *    b. 升级冒险家属性（智能分配水晶，每轮最多100次）
 *    c. 公会升级（自动判断条件，可连续升级最多10次）
 * 7. 根据权重和概率选择并执行其他行动
 */

import GameBotProfile from '../../models/gameBotProfile.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import GameFormation from '../../models/gameFormation.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import GamePlayerMail from '../../models/gamePlayerMail.js'
import GameMine from '../../models/gameMine.js'
import GameArenaRegistration from '../../models/gameArenaRegistration.js'
import GameMarketListing from '../../models/gameMarketListing.js'
import GameRuneStoneListing from '../../models/gameRuneStoneListing.js'
import GameOfficialMarketStock from '../../models/gameOfficialMarketStock.js'

import * as dungeonService from './dungeonService.js'
import * as adventurerService from './adventurerService.js'
import * as formationService from './formationService.js'
import * as arenaService from './arenaService.js'
import * as mineService from './mineService.js'
import * as marketService from './marketService.js'
import * as guildService from './guildService.js'
import * as mailService from './mailService.js'
import * as legionService from './legionService.js'

import {
  getMaxAdventurerCount,
  getMaxComprehensiveLevel,
  getAdventurerLevelUpCrystalCost,
  getAdventurerLevelUpGoldCost,
  getRequiredMaxLevelAdventurerCount,
  getGuildLevelUpFee
} from 'shared/utils/guildLevelUtils.js'

import logger from '../../utils/logger.js'
import { executeInLock } from '../../utils/utils.js'

// ─── 工具函数 ──────────────────────────────────────

/** 以权重概率判断是否触发行动（weight: 0-100） */
function shouldAct(weight) {
  return Math.random() * 100 < weight
}

/** 从数组中随机选择一个 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 符文石稀有度中文名 */
function getRuneStoneRarityLabel(rarity) {
  return (
    {
      normal: '普通',
      rare: '稀有',
      legendary: '传说'
    }[rarity] || rarity
  )
}

function getOfficialRuneStoneBuyPrice(rarity, gameSettings) {
  const officialPriceMap = {
    normal: gameSettings.officialNormalRuneStoneBuyPrice ?? 100,
    rare: gameSettings.officialRareRuneStoneBuyPrice ?? 400,
    legendary: gameSettings.officialLegendaryRuneStoneBuyPrice ?? 2000
  }

  return officialPriceMap[rarity] ?? 0
}

async function getBotRuneStoneListingPrice(accountId, runeStone, gameSettings) {
  const freeMarketRuneStoneMinPrice =
    gameSettings.freeMarketRuneStoneMinPrice ?? 100
  const officialBuyPrice = getOfficialRuneStoneBuyPrice(
    runeStone.rarity,
    gameSettings
  )

  const marketListings = await GameRuneStoneListing.find({
    status: 'active',
    account: { $ne: accountId }
  })
    .populate({
      path: 'runeStone',
      match: { rarity: runeStone.rarity, level: runeStone.level }
    })
    .sort({ price: 1 })
    .lean()

  const sameTypeListings = marketListings.filter(listing => listing.runeStone)
  const marketLowestPrice =
    sameTypeListings.length > 0
      ? sameTypeListings[0].price
      : freeMarketRuneStoneMinPrice + 10

  return Math.max(
    marketLowestPrice,
    freeMarketRuneStoneMinPrice,
    officialBuyPrice > 0 ? officialBuyPrice + 1 : 0
  )
}

/** 水晶类型中文名 */
function getCrystalTypeLabel(type, mode = 'full') {
  const labelMap = {
    short: {
      attackCrystal: '攻',
      defenseCrystal: '防',
      speedCrystal: '速',
      sanCrystal: 'SAN'
    },
    full: {
      attackCrystal: '攻击水晶',
      defenseCrystal: '防御水晶',
      speedCrystal: '速度水晶',
      sanCrystal: 'SAN水晶'
    }
  }

  return labelMap[mode]?.[type] || labelMap.full[type] || type
}

/** 结算水晶日志文案 */
function formatCrystalSettleAction(result) {
  if (!result) return null

  const crystalEntries = Object.entries(result.crystals || {}).filter(
    ([, quantity]) => quantity > 0
  )
  const totalCrystals = crystalEntries.reduce(
    (sum, [, quantity]) => sum + quantity,
    0
  )
  const runeStoneCount = result.runeStones?.length || 0

  const parts = []
  if (crystalEntries.length > 0) {
    parts.push(
      crystalEntries
        .map(
          ([type, quantity]) =>
            `${getCrystalTypeLabel(type, 'short')}${quantity}`
        )
        .join(' ')
    )
    parts.push(`共${totalCrystals}`)
  }
  if (runeStoneCount > 0) {
    parts.push(`掉落${runeStoneCount}个符文石`)
  }

  return parts.length > 0 ? `结算水晶：${parts.join('，')}` : '结算水晶：无产出'
}

/** 等待指定毫秒（用于战斗冷却间隔） */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 安全调用，捕获错误记录日志 */
async function safeExec(label, fn) {
  try {
    return await fn()
  } catch (err) {
    // 只记录非预期错误，游戏规则限制类错误(400/404/429)是正常的
    if (!err.statusCode || err.statusCode >= 500) {
      logger.error(`[Bot] ${label} 异常: ${err.message}`)
    }
    return null
  }
}

// ─── 行动节点 ──────────────────────────────────────

/**
 * 1. 结算水晶
 */
async function actionSettleCrystals(accountId) {
  return await safeExec('结算水晶', async () => {
    const result = await dungeonService.settleCrystals(accountId)
    return formatCrystalSettleAction(result)
  })
}

/**
 * 2. 领取邮件附件
 */
async function actionClaimMails(accountId) {
  return await safeExec('领取邮件', async () => {
    const { list } = await mailService.listMails(accountId, {
      page: 1,
      pageSize: 50
    })
    let claimed = 0
    for (const mail of list) {
      if (mail.hasAttachment && !mail.claimed) {
        await safeExec('领取邮件附件', () =>
          mailService.claimMailAttachment(accountId, mail._id)
        )
        claimed++
      }
    }
    return claimed > 0 ? `领取了${claimed}封邮件附件` : null
  })
}

/**
 * 计算升级属性所需的水晶总量
 * @param {object[]} adventurers - 冒险家列表
 * @param {number} maxCompLevel - 当前公会最大综合等级
 * @param {number} crystalBase - 升级素材基数
 * @returns {object} 各类型水晶所需数量 { attackCrystal, defenseCrystal, speedCrystal, sanCrystal }
 */
function calculateUpgradeCrystalNeeds(adventurers, maxCompLevel, crystalBase) {
  const needs = {
    attackCrystal: 0,
    defenseCrystal: 0,
    speedCrystal: 0,
    sanCrystal: 0
  }

  const statToKey = {
    attack: 'attackCrystal',
    defense: 'defenseCrystal',
    speed: 'speedCrystal',
    san: 'sanCrystal'
  }
  const levelMap = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }

  for (const adv of adventurers) {
    const compLevel =
      adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel - 3
    if (compLevel >= maxCompLevel) continue

    // 估算到 maxCompLevel 的全部升级次数
    const levelsToGain = maxCompLevel - compLevel
    const levelsPerStat = Math.ceil(levelsToGain / 4)

    for (const stat of ['attack', 'defense', 'speed', 'san']) {
      const currentLevel = adv[levelMap[stat]]
      let totalCost = 0
      for (
        let i = 0;
        i < levelsPerStat && currentLevel + i < maxCompLevel;
        i++
      ) {
        totalCost += getAdventurerLevelUpCrystalCost(
          currentLevel + i,
          crystalBase
        )
      }
      needs[statToKey[stat]] += totalCost
    }
  }

  return needs
}

/**
 * 计算公会升级所需的金币总量（估算未来若干次升级费用）
 * 算法：从当前公会等级开始，估算到下一次升级需要的金币，同时也预估招募冒险家的费用
 * @param {number} guildLevel - 当前公会等级
 * @param {number} feeBase - 升级手续费基数
 * @param {number} adventurerCount - 当前冒险家数量
 * @param {number} recruitPrice - 招募冒险家的费用
 * @returns {number} 需要预留的金币总量
 */
function calculateGuildUpgradeGoldNeeds(
  guildLevel,
  feeBase,
  adventurerCount,
  recruitPrice
) {
  // 下次公会升级的手续费
  const upgradeFee = getGuildLevelUpFee(guildLevel, feeBase)

  // 下次公会升级需要的满级冒险家数量
  const requiredAdventurers = getRequiredMaxLevelAdventurerCount(guildLevel)
  // 还需要招募多少冒险家（未满时需要招募金币）
  const recruitNeeded = Math.max(0, requiredAdventurers - adventurerCount)
  const recruitCost = recruitNeeded * recruitPrice

  // 总计：升级费 + 招募费
  return upgradeFee + recruitCost
}

/**
 * 计算近期升级冒险家属性所需的金币
 * 从所有可升级的属性中取出最便宜的 maxLevels 次升级成本
 * @param {object[]} adventurers - 冒险家列表
 * @param {number} maxCompLevel - 当前公会最大综合等级
 * @param {number} goldBase - 升级金币基数
 * @param {number} maxLevels - 最多计算多少次升级（默认20，即一次tick的最大升级次数）
 * @returns {number} 近期升级所需金币
 */
function calculateNearTermUpgradeGoldNeeds(
  adventurers,
  maxCompLevel,
  goldBase,
  maxLevels = 20
) {
  const levelMap = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }

  // 收集所有可执行的单次升级的金币成本
  const costs = []
  for (const adv of adventurers) {
    const compLevel =
      adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel - 3
    if (compLevel >= maxCompLevel) continue

    for (const stat of ['attack', 'defense', 'speed', 'san']) {
      const currentLevel = adv[levelMap[stat]]
      if (currentLevel < maxCompLevel) {
        costs.push(getAdventurerLevelUpGoldCost(currentLevel, goldBase))
      }
    }
  }

  // 按成本从低到高排序，取前 maxLevels 次
  costs.sort((a, b) => a - b)
  let total = 0
  for (let i = 0; i < Math.min(maxLevels, costs.length); i++) {
    total += costs[i]
  }
  return total
}

/**
 * 3. 招募冒险家（共通行动）
 * 优先招募到下次公会升级所需的冒险家数量，最多不超过25个
 */
async function actionRecruitAdventurer(accountId) {
  return await safeExec('招募冒险家', async () => {
    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) return null

    const guildLevel = playerInfo.guildLevel || 1
    // 下次公会升级需要的满级冒险家数量
    const requiredForNextUpgrade =
      getRequiredMaxLevelAdventurerCount(guildLevel)
    // 机器人优先招募到下次升级所需数量，最多25名，不超过公会等级上限
    const targetAdventurers = Math.min(
      requiredForNextUpgrade,
      25,
      getMaxAdventurerCount(guildLevel)
    )

    if (playerInfo.adventurerCount >= targetAdventurers) return null

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const recruitPrice = gameSettings.adventurerRecruitPrice ?? 10000

    let recruited = 0
    let currentGold = playerInfo.gold
    let currentCount = playerInfo.adventurerCount

    while (currentCount < targetAdventurers && currentGold >= recruitPrice) {
      const result = await safeExec('招募', () =>
        adventurerService.recruitAdventurer(accountId)
      )
      if (!result) break
      recruited++
      currentGold -= recruitPrice
      currentCount++
    }

    return recruited > 0
      ? `招募了${recruited}名冒险家（目标${targetAdventurers}名）`
      : null
  })
}

/**
 * 4. 升级冒险家属性
 * 智能分配策略：
 * - aggressive: 攻击45% 速度35% 防御10% SAN10%
 * - balanced: 各25%
 * - defensive: 防御35% SAN35% 攻击15% 速度15%
 * - trader: 各25%
 */
async function actionLevelUpStats(accountId, bot) {
  return await safeExec('升级属性', async () => {
    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) return null

    const inventory = await GamePlayerInventory.findOne({
      account: accountId
    }).lean()
    if (!inventory) return null

    const adventurers = await GameAdventurer.find({ account: accountId })
      .sort({ comprehensiveLevel: 1 })
      .lean()
    if (adventurers.length === 0) return null

    const maxCompLevel = getMaxComprehensiveLevel(playerInfo.guildLevel || 1)
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const crystalBase = gameSettings.adventurerLevelUpCrystalBase ?? 100
    const goldBase = gameSettings.adventurerLevelUpGoldBase ?? 500

    // 读取冒险家角色分配
    const advRoles = bot.adventurerRoles || new Map()
    // 兼容 Mongoose Map 和普通对象
    const getRoleOf = advId => {
      const id = advId.toString()
      if (advRoles instanceof Map) return advRoles.get(id) || 'balanced'
      return advRoles[id] || 'balanced'
    }

    let totalUpgrades = 0
    const maxUpgradesPerTick = 100 // 每次调用最多升级次数，确保尽可能花完资源
    // 按综合等级从低到高，优先升级低等级冒险家
    for (const adv of adventurers) {
      if (totalUpgrades >= maxUpgradesPerTick) break

      const compLevel =
        adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel - 3
      if (compLevel >= maxCompLevel) continue

      // 尝试对同一冒险家升级多次（最多20次），尽可能花完资源
      for (let i = 0; i < 20 && totalUpgrades < maxUpgradesPerTick; i++) {
        // 根据冒险家角色选择属性分配权重
        const role = getRoleOf(adv._id)
        const statType = chooseStatToUpgrade(adv, getRoleWeights(role))
        if (!statType) break

        const crystalMap = {
          attack: 'attackCrystal',
          defense: 'defenseCrystal',
          speed: 'speedCrystal',
          san: 'sanCrystal'
        }
        const levelMap = {
          attack: 'attackLevel',
          defense: 'defenseLevel',
          speed: 'speedLevel',
          san: 'SANLevel'
        }

        const currentLevel = adv[levelMap[statType]]
        const crystalCost = getAdventurerLevelUpCrystalCost(
          currentLevel,
          crystalBase
        )
        const goldCost = getAdventurerLevelUpGoldCost(currentLevel, goldBase)

        if (
          playerInfo.gold < goldCost ||
          (inventory[crystalMap[statType]] || 0) < crystalCost
        ) {
          break
        }

        const result = await safeExec('升级冒险家属性', () =>
          adventurerService.levelUpStat(accountId, adv._id, statType, 1)
        )
        if (result) {
          totalUpgrades++
          // 更新本地缓存
          playerInfo.gold -= goldCost
          inventory[crystalMap[statType]] -= crystalCost
          adv[levelMap[statType]]++
        } else {
          break
        }
      }
    }

    return totalUpgrades > 0 ? `升级了${totalUpgrades}次属性` : null
  })
}

/**
 * 根据冒险家角色获取属性分配权重
 * tank: 只加防御+SAN
 * assassin: 只加速度
 * dps: 只加攻击
 * balanced: 均匀分配
 */
function getRoleWeights(role) {
  switch (role) {
    case 'tank':
      return { attack: 0, defense: 50, speed: 0, san: 50 }
    case 'assassin':
      return { attack: 0, defense: 0, speed: 100, san: 0 }
    case 'dps':
      return { attack: 100, defense: 0, speed: 0, san: 0 }
    case 'balanced':
    default:
      return { attack: 25, defense: 25, speed: 25, san: 25 }
  }
}

function chooseStatToUpgrade(adventurer, weights) {
  // 根据当前属性差距和目标权重，选择最需要升级的属性
  const levels = {
    attack: adventurer.attackLevel,
    defense: adventurer.defenseLevel,
    speed: adventurer.speedLevel,
    san: adventurer.SANLevel
  }

  const totalLevel = Object.values(levels).reduce((a, b) => a + b, 0)
  if (totalLevel <= 4) {
    // 初始状态，按权重随机选
    return weightedRandom(weights)
  }

  // 计算每个属性的理想等级和实际等级差距
  const candidates = []
  for (const [stat, weight] of Object.entries(weights)) {
    const idealRatio = weight / 100
    const actualRatio = levels[stat] / totalLevel
    const deficit = idealRatio - actualRatio
    candidates.push({ stat, deficit, weight })
  }

  // 按差距排序，优先升级差距最大的属性，随机选择差距最大的前两个之一
  candidates.sort((a, b) => b.deficit - a.deficit)
  const topN = candidates.slice(0, 2)
  return pickRandom(topN).stat
}

function weightedRandom(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [stat, w] of Object.entries(weights)) {
    r -= w
    if (r <= 0) return stat
  }
  return 'attack'
}

/**
 * 5. 切换地牢
 */
async function actionSwitchDungeon(accountId) {
  return await safeExec('切换地牢', async () => {
    await dungeonService.switchDungeon(accountId)
    return '切换了地牢'
  })
}

/**
 * 6. 地牢军团战斗
 */
async function actionDungeonBattle(accountId) {
  return await safeExec('地牢战斗', async () => {
    // 确保有阵容
    const formations = await GameFormation.find({ account: accountId }).lean()
    if (formations.length === 0) return null

    // 找第一个有冒险家的阵容
    const validFormation = formations.find(f =>
      f.grid.flat().some(id => id !== null)
    )
    if (!validFormation) return null

    let totalBattles = 0
    let upgraded = false
    let lastLevel = 0
    const maxBattles = 5

    while (totalBattles < maxBattles) {
      if (totalBattles > 0) await delay(3200) // 战斗冷却

      const result = await safeExec('军团挑战', () =>
        legionService.challengeLegion(accountId, validFormation.slot)
      )
      if (!result) break

      totalBattles++
      if (result.upgraded) {
        upgraded = true
        lastLevel = result.newDungeonLevel
      } else {
        break // 未能升级，停止继续挑战
      }
    }

    if (totalBattles === 0) return null
    if (upgraded) {
      return `地牢战斗${totalBattles}次，等级提升至 ${lastLevel}`
    }
    return `地牢战斗${totalBattles}次`
  })
}

/**
 * 7. 竞技场行动
 */
async function actionArena(accountId) {
  return await safeExec('竞技场', async () => {
    const info = await arenaService.getArenaInfo(accountId)
    if (info.status !== 'active') return null

    // 未报名则报名
    if (!info.registration) {
      // 找一个有冒险家的阵容
      const formations = await GameFormation.find({ account: accountId }).lean()
      const validFormation = formations.find(f =>
        f.grid.flat().some(id => id !== null)
      )
      if (!validFormation) return null

      await arenaService.registerArena(accountId, validFormation.slot)
      return '报名了竞技场'
    }

    // 已报名，尝试挑战（每次tick最多3-5次）
    if (info.registration.challengeUses <= 0) return null

    const maxChallenges = Math.min(
      info.registration.challengeUses,
      3 + Math.floor(Math.random() * 3) // 3~5次
    )
    const actions = []
    let lostToHigher = false
    let myPoints = info.registration.points
    let consecutiveRefreshes = 0
    const maxRefreshes = 3

    for (let i = 0; i < maxChallenges; i++) {
      if (i > 0) await delay(3200) // 战斗冷却

      // 获取对手列表（含已挑战ID列表）
      const matchResult = await arenaService.getMatchList(accountId, false)
      const opponents = matchResult.opponents || []
      if (opponents.length === 0) break

      // 使用服务端返回的最新积分
      myPoints = matchResult.myPoints ?? myPoints

      // 检查剩余挑战次数
      const currentInfo = await arenaService.getArenaInfo(accountId)
      if ((currentInfo.registration?.challengeUses || 0) <= 0) break
      myPoints = currentInfo.registration?.points ?? myPoints

      // 用 challengedIds 过滤已挑战的对手
      const challengedSet = new Set(
        (matchResult.challengedIds || []).map(id => id.toString())
      )
      const unchallenged = opponents.filter(
        o =>
          !challengedSet.has(o._id?.toString()) &&
          !challengedSet.has(o.registrationId?.toString())
      )

      // 按积分分组：高于自己的 和 低于/等于自己的
      const higherOps = unchallenged
        .filter(o => o.points > myPoints)
        .sort((a, b) => b.points - a.points)
      const lowerOps = unchallenged
        .filter(o => o.points <= myPoints)
        .sort((a, b) => b.points - a.points)

      let target = null
      if (higherOps.length > 0) {
        // 优先挑战高积分对手
        target = higherOps[0]
      } else if (unchallenged.length === 0) {
        // 所有对手都已挑战过，刷新列表
        consecutiveRefreshes++
        if (consecutiveRefreshes > maxRefreshes) break
        await safeExec('刷新对手', () =>
          arenaService.getMatchList(accountId, true)
        )
        lostToHigher = false
        continue
      } else if (!lostToHigher) {
        // 没有高积分对手 & 没输给过高积分对手 → 刷新寻找新的高积分对手
        consecutiveRefreshes++
        if (consecutiveRefreshes > maxRefreshes) {
          // 刷新次数用完，挑战低积分对手
          target = lowerOps[0]
        } else {
          await safeExec('刷新对手', () =>
            arenaService.getMatchList(accountId, true)
          )
          lostToHigher = false
          continue
        }
      } else {
        // 输给过高积分对手，不刷新，继续挑战低积分对手
        target = lowerOps[0]
      }

      if (!target) break

      const result = await safeExec('竞技场挑战', () =>
        arenaService.challengeOpponent(accountId, target.registrationId)
      )
      if (result) {
        // 更新本地积分为最新值
        myPoints = result.newPoints ?? myPoints
        actions.push(`对手积分${target.points}`)
        // 判断是否输给了高积分对手
        if (
          target.points > myPoints + (result.pointsChange || 0) &&
          result.battleResult?.winner !== 'attacker'
        ) {
          lostToHigher = true
        }
      }
      consecutiveRefreshes = 0
    }

    return actions.length > 0
      ? `竞技场挑战${actions.length}次（${actions.join('，')}）`
      : null
  })
}

/**
 * 8. 矿场探索
 */
async function actionMineExplore(accountId) {
  return await safeExec('矿场探索', async () => {
    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) return null

    // 检查挖矿次数
    const now = Date.now()
    const lastRecover = new Date(
      playerInfo.lastMiningRecoverAt || now
    ).getTime()
    const hoursElapsed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
    const currentUses = Math.min(playerInfo.miningCanUses + hoursElapsed, 24)
    if (currentUses <= 0) return null

    // 需要阵容来战斗
    const formations = await GameFormation.find({ account: accountId }).lean()
    const validFormation = formations.find(f =>
      f.grid.flat().some(id => id !== null)
    )
    if (!validFormation) return null

    // 每次tick探索3~5个格子
    const maxDigs = Math.min(currentUses, 3 + Math.floor(Math.random() * 3))
    const actions = []

    for (let i = 0; i < maxDigs; i++) {
      // 找一个推荐矿场
      const { recommended } = await mineService.listMines({
        accountId: accountId,
        page: 1,
        pageSize: 5
      })
      const targetMine = recommended.length > 0 ? pickRandom(recommended) : null
      if (!targetMine) break

      // 获取矿场详情，找未探索的格子
      const mineDetail = await mineService.getMineDetail(targetMine._id)
      const unexplored = []
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (!mineDetail.grid[r][c].revealed) {
            unexplored.push({ row: r, col: c })
          }
        }
      }
      if (unexplored.length === 0) continue

      // 智能选择：优先选旁边有数字提示的格子
      const hinted = unexplored.filter(({ row, col }) => {
        const DIRS = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1]
        ]
        return DIRS.some(([dr, dc]) => {
          const nr = row + dr
          const nc = col + dc
          if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) return false
          const cell = mineDetail.grid[nr][nc]
          return (
            cell.revealed && cell.type === 'number' && cell.adjacentRewards > 0
          )
        })
      })

      const target =
        hinted.length > 0 ? pickRandom(hinted) : pickRandom(unexplored)

      const result = await safeExec('挖矿', () =>
        mineService.digCell(
          accountId,
          targetMine._id,
          target.row,
          target.col,
          validFormation.slot
        )
      )
      if (!result) break
      actions.push(`Lv.${mineDetail.level || targetMine.level}矿格`)
    }

    return actions.length > 0
      ? `探索了${actions.length}个矿场格子：${actions.join('，')}`
      : null
  })
}

/**
 * 9. 卖水晶换金币（共通行动）
 * - 机器人每次行动都会执行此操作（为招募冒险家和公会升级准备金币）
 * - 智能计算需要保留多少水晶用于属性升级
 * - 同时考虑公会升级和招募所需金币，金币不足时额外卖出水晶
 * - 当设置了 maxMarketAmount，先挂到自由市场，超出部分卖给官方
 * - 若 maxMarketAmount 为 0 或未设置，则直接卖给官方
 */
async function actionSellCrystals(accountId, bot) {
  return await safeExec('卖水晶', async () => {
    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) return null

    const inventory = await GamePlayerInventory.findOne({
      account: accountId
    }).lean()
    if (!inventory) return null

    const adventurers = await GameAdventurer.find({ account: accountId })
      .sort({ comprehensiveLevel: 1 })
      .lean()

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const crystalBase = gameSettings.adventurerLevelUpCrystalBase ?? 100
    const freeMarketMinPrice = gameSettings.freeMarketMinPrice ?? 100
    const officialBuyPrice = gameSettings.officialCrystalBuyPrice ?? 100
    const guildLevel = playerInfo.guildLevel || 1
    const maxCompLevel = getMaxComprehensiveLevel(guildLevel)

    // 计算属性升级所需的水晶（用于决定保留多少）
    const crystalNeeds = calculateUpgradeCrystalNeeds(
      adventurers,
      maxCompLevel,
      crystalBase
    )

    // 计算公会升级 + 招募冒险家所需的金币
    const feeBase = gameSettings.guildLevelUpFeeBase ?? 1000
    const recruitPrice = gameSettings.adventurerRecruitPrice ?? 10000
    const goldNeeded = calculateGuildUpgradeGoldNeeds(
      guildLevel,
      feeBase,
      adventurers.length,
      recruitPrice
    )
    // 当前金币缺口（需要通过卖水晶补足的部分）
    const goldDeficit = Math.max(0, goldNeeded - (playerInfo.gold || 0))
    // 按官方价格估算需要额外卖出的水晶总量，平均分配到4种水晶
    const extraSellPerType =
      goldDeficit > 0 ? Math.ceil(goldDeficit / officialBuyPrice / 4) : 0

    // 从 marketSettings 获取市场挂卖设置
    const ms = bot.marketSettings || {}
    const crystalSellSettings = ms.sellCrystals || {}
    const maxMarketAmount = crystalSellSettings.maxMarketAmount ?? 0

    const crystalTypes = [
      'attackCrystal',
      'defenseCrystal',
      'speedCrystal',
      'sanCrystal'
    ]

    const actions = []

    for (const type of crystalTypes) {
      const held = inventory[type] || 0
      // 保留用于属性升级的水晶数量（保留估算需要量的1.2倍，确保有余量）
      const reserveForUpgrade = Math.ceil(crystalNeeds[type] * 1.2)
      // 基础可出售量 = 持有量 - 属性升级保留量
      const baseSellable = Math.max(0, held - reserveForUpgrade)
      // 如果金币不足以支撑公会升级/招募，额外卖出一部分水晶（从保留量中借用）
      // 但绝不能让卖出后的水晶低于实际需求量（避免低卖高买回同类型水晶的亏损）
      let sellableQty = baseSellable
      if (extraSellPerType > 0) {
        const absoluteMin = crystalNeeds[type] // 绝对最低保留量 = 实际需求量
        const maxExtraSellable = Math.max(0, held - absoluteMin)
        sellableQty = Math.min(
          Math.max(baseSellable, baseSellable + extraSellPerType),
          maxExtraSellable
        )
      }
      if (sellableQty < 10) continue

      // 查看当前已上架的卖单数量
      const myActiveOrders = await GameMarketListing.find({
        account: accountId,
        materialType: type,
        orderType: 'sell',
        status: 'active'
      }).lean()
      const alreadyListed = myActiveOrders.reduce(
        (sum, o) => sum + (o.quantity || 0),
        0
      )

      let marketQty = 0
      let officialQty = sellableQty

      // 当设置了 maxMarketAmount 且大于 0，先挂到自由市场
      if (maxMarketAmount > 0) {
        const canListOnMarket = Math.max(0, maxMarketAmount - alreadyListed)
        marketQty = Math.min(sellableQty, canListOnMarket)
        officialQty = sellableQty - marketQty
      }

      // 挂单到自由市场
      if (marketQty >= 10) {
        // 调研市场最低价
        const sellOrders = await GameMarketListing.find({
          materialType: type,
          orderType: 'sell',
          status: 'active',
          account: { $ne: accountId }
        })
          .sort({ unitPrice: 1 })
          .limit(1)
          .lean()

        let listPrice
        if (sellOrders.length > 0) {
          listPrice = sellOrders[0].unitPrice
        } else {
          listPrice = freeMarketMinPrice + 10
        }

        await safeExec('挂卖单', () =>
          marketService.createMaterialSellOrder(
            accountId,
            type,
            marketQty,
            listPrice
          )
        )
        actions.push(
          `挂卖${marketQty}个${getCrystalTypeLabel(type)}，单价${listPrice}`
        )
      }

      // 剩余的卖给官方
      if (officialQty >= 10) {
        await safeExec('卖给官方', () =>
          marketService.smartSellCrystal(accountId, type, officialQty)
        )
        actions.push(`官方出售${officialQty}个${getCrystalTypeLabel(type)}`)
      }
    }

    // 收取已完成订单的金币
    const completedOrders = await GameMarketListing.find({
      account: accountId,
      status: 'active',
      pendingGold: { $gt: 0 }
    }).lean()
    for (const order of completedOrders) {
      await safeExec('收取挂单金币', () =>
        marketService.collectMaterialOrder(accountId, order._id)
      )
    }

    return actions.length > 0 ? actions.join('；') : null
  })
}

/**
 * 出售所有符文石碎片（共通行动）
 * 将所有碎片卖给官方市场换取金币
 */
async function actionSellRuneFragments(accountId) {
  return await safeExec('出售符文石碎片', async () => {
    const inventory = await GamePlayerInventory.findOne({
      account: accountId
    }).lean()
    if (!inventory || !inventory.runeFragment || inventory.runeFragment <= 0) {
      return null
    }

    const quantity = inventory.runeFragment
    const result = await marketService.sellRuneFragmentToOfficial(
      accountId,
      // sellRuneFragmentToOfficial 限制最大 99999，分批出售
      Math.min(quantity, 99999)
    )
    if (!result) return null

    // 如果碎片超过 99999，继续出售剩余部分
    let totalGold = result.goldEarned
    let totalSold = Math.min(quantity, 99999)
    let remaining = quantity - totalSold

    while (remaining > 0) {
      const batch = Math.min(remaining, 99999)
      const batchResult = await safeExec('出售碎片批次', () =>
        marketService.sellRuneFragmentToOfficial(accountId, batch)
      )
      if (!batchResult) break
      totalGold += batchResult.goldEarned
      totalSold += batch
      remaining -= batch
    }

    return `出售了${totalSold}个符文石碎片，获得${totalGold}金币`
  })
}

/**
 * 购买水晶（共通行动）
 *
 * 严谨的购买算法：
 * 1. 计算各类型水晶缺口（升级所需量 - 当前持有量）
 * 2. 计算必须预留的金币（公会升级费 + 招募费 + 近期升级金币消耗）
 * 3. 可用预算 = 当前金币 - 预留金（不保留额外安全余量，配合多轮循环尽可能花完资源）
 * 4. 按各类型缺口比例分配预算
 * 5. 对每种缺口水晶：
 *    a. 先收取已有的求购待领取素材
 *    b. 扫描玩家市场卖单（按价格升序），只购买单价 < 官方售价的合理订单
 *    c. 剩余缺口从官方市场购买（官方售价）
 * 6. 每笔购买都检查预算是否充足，严格不超支
 *
 * 价格合理性判断：
 * - 玩家卖单价格 < 官方售价 × maxPriceRatio → 合理，购买
 * - 玩家卖单价格 >= 官方售价 × maxPriceRatio → 过高，跳过
 * - 无低价玩家卖单时，从官方市场按固定价购买
 */
async function actionBuyCrystals(accountId, bot) {
  return await safeExec('购买水晶', async () => {
    // 检查是否启用水晶购买
    const ms = bot.marketSettings || {}
    const buyCrystalSettings = ms.buyCrystals || {}
    if (buyCrystalSettings.enabled === false) return null

    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) return null

    const inventory = await GamePlayerInventory.findOne({
      account: accountId
    }).lean()
    if (!inventory) return null

    const adventurers = await GameAdventurer.find({ account: accountId })
      .sort({ comprehensiveLevel: 1 })
      .lean()
    if (adventurers.length === 0) return null

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const crystalBase = gameSettings.adventurerLevelUpCrystalBase ?? 100
    const goldBase = gameSettings.adventurerLevelUpGoldBase ?? 500
    const officialSellPrice = gameSettings.officialCrystalSellPrice ?? 10000
    const feeBase = gameSettings.guildLevelUpFeeBase ?? 1000
    const recruitPrice = gameSettings.adventurerRecruitPrice ?? 10000
    const maxPriceRatio = buyCrystalSettings.maxPriceRatio ?? 1.0

    const guildLevel = playerInfo.guildLevel || 1
    const maxCompLevel = getMaxComprehensiveLevel(guildLevel)

    // ── Step 1: 计算各类型水晶缺口 ──
    const crystalNeeds = calculateUpgradeCrystalNeeds(
      adventurers,
      maxCompLevel,
      crystalBase
    )
    const crystalTypes = [
      'attackCrystal',
      'defenseCrystal',
      'speedCrystal',
      'sanCrystal'
    ]
    const deficits = {}
    let totalDeficit = 0
    for (const type of crystalTypes) {
      const deficit = Math.max(0, crystalNeeds[type] - (inventory[type] || 0))
      if (deficit > 0) {
        deficits[type] = deficit
        totalDeficit += deficit
      }
    }
    if (totalDeficit === 0) return null

    // ── Step 2: 计算必须预留的金币 ──
    // 公会升级 + 招募冒险家费用
    const guildReserve = calculateGuildUpgradeGoldNeeds(
      guildLevel,
      feeBase,
      adventurers.length,
      recruitPrice
    )
    // 近期升级属性所需金币（预留一轮升级的金币消耗，多轮循环中逐步释放预算）
    const nearTermGoldReserve = calculateNearTermUpgradeGoldNeeds(
      adventurers,
      maxCompLevel,
      goldBase,
      20
    )
    const totalReserve = guildReserve + nearTermGoldReserve

    // ── Step 3: 计算可用预算 ──
    // 可用预算 = 当前金币 - 预留金（不保留额外安全余量，避免屯积资源）
    let availableBudget = Math.max(0, playerInfo.gold - totalReserve)
    if (availableBudget <= 0) return null

    // 玩家市场可接受的最高单价
    const maxAcceptablePrice = Math.floor(officialSellPrice * maxPriceRatio)

    const actions = []
    const deficitTypes = Object.keys(deficits)

    // ── Step 4: 先收取所有待领取的求购单素材 ──
    const pendingBuyOrders = await GameMarketListing.find({
      account: accountId,
      orderType: 'buy',
      status: { $in: ['active', 'completed'] },
      pendingQuantity: { $gt: 0 }
    }).lean()
    for (const order of pendingBuyOrders) {
      await safeExec('收取求购素材', () =>
        marketService.collectMaterialOrder(accountId, order._id)
      )
    }

    // ── Step 5: 按缺口比例分配预算并购买 ──
    for (const type of deficitTypes) {
      let deficit = deficits[type]
      // 按缺口比例分配预算（缺口越大分配越多）
      let typeBudget = Math.floor(availableBudget * (deficit / totalDeficit))
      if (typeBudget <= 0) continue

      let boughtFromPlayers = 0
      let boughtFromOfficial = 0
      let goldSpentOnPlayers = 0
      let goldSpentOnOfficial = 0

      // ── Step 5a: 从玩家市场购买低价卖单 ──
      // 查询价格低于可接受上限的活跃卖单，按价格升序排列
      const sellOrders = await GameMarketListing.find({
        orderType: 'sell',
        materialType: type,
        status: 'active',
        account: { $ne: accountId },
        unitPrice: { $lt: maxAcceptablePrice }
      })
        .sort({ unitPrice: 1 })
        .lean()

      for (const order of sellOrders) {
        if (deficit <= 0 || typeBudget <= 0) break

        // 计算本单可购买数量：不超过缺口、不超过订单剩余、不超过预算
        const maxAffordable = Math.floor(typeBudget / order.unitPrice)
        const buyQty = Math.min(deficit, order.quantity, maxAffordable)
        if (buyQty <= 0) break

        const result = await safeExec('购买玩家水晶', () =>
          marketService.fulfillMaterialSellOrder(accountId, order._id, buyQty)
        )
        if (result) {
          const cost = result.goldSpent
          deficit -= result.quantity
          typeBudget -= cost
          availableBudget -= cost
          boughtFromPlayers += result.quantity
          goldSpentOnPlayers += cost
        }
      }

      // ── Step 5b: 剩余缺口从官方市场购买 ──
      if (deficit > 0 && typeBudget >= officialSellPrice) {
        const stock = await GameOfficialMarketStock.findOne({
          key: 'global'
        }).lean()
        const officialAvailable = stock?.[type] || 0

        if (officialAvailable > 0) {
          const maxAffordable = Math.floor(typeBudget / officialSellPrice)
          const buyQty = Math.min(
            deficit,
            maxAffordable,
            officialAvailable,
            99999 // 单次购买上限
          )
          if (buyQty > 0) {
            const result = await safeExec('购买官方水晶', () =>
              marketService.buyCrystalFromOfficial(accountId, type, buyQty)
            )
            if (result) {
              deficit -= buyQty
              const cost = result.goldSpent
              typeBudget -= cost
              availableBudget -= cost
              boughtFromOfficial += buyQty
              goldSpentOnOfficial += cost
            }
          }
        }
      }

      // 记录购买日志
      const label = getCrystalTypeLabel(type)
      if (boughtFromPlayers > 0) {
        actions.push(
          `从玩家市场购买${boughtFromPlayers}个${label}（花费${goldSpentOnPlayers}金币）`
        )
      }
      if (boughtFromOfficial > 0) {
        actions.push(
          `从官方市场购买${boughtFromOfficial}个${label}（花费${goldSpentOnOfficial}金币）`
        )
      }
    }

    return actions.length > 0 ? actions.join('；') : null
  })
}

/**
 * 10. 符文石管理
 * - 先装备最优符文石
 * - 替换已装备但品质低的符文石
 * - 若开启符文石出售：挂卖指定稀有度的符文石
 *   - 调研同稀有度同等级市场价，以最低价出售
 *   - 超出最大挂卖数量时：下架低级的替换高级的，低级卖给官方变现
 * - 剩余未装备未上架的符文石统一卖给官方，不做分解
 */
async function actionRuneStoneManage(accountId, bot) {
  return await safeExec('符文石管理', async () => {
    const actions = []

    // 获取所有符文石（排除已上架的）
    const runeStones = await GameRuneStone.find({
      account: accountId,
      listedOnMarket: { $ne: true }
    }).lean()
    if (runeStones.length === 0) return null

    // 获取冒险家列表，按角色优先级排序（刺客>输出>平均>肉盾）
    const adventurers = await GameAdventurer.find({ account: accountId }).lean()

    // 角色优先级：刺客(3) > 输出(1) > 平均(4) > 肉盾(2) > 未标记(0)
    const advRoles = bot.adventurerRoles || {}
    const getRoleOf = advId => {
      const id = advId.toString()
      if (advRoles instanceof Map) return advRoles.get(id) || 'balanced'
      return advRoles[id] || 'balanced'
    }
    const rolePriority = { assassin: 4, dps: 3, balanced: 2, tank: 1 }
    adventurers.sort((a, b) => {
      const pa = rolePriority[getRoleOf(a._id)] || 0
      const pb = rolePriority[getRoleOf(b._id)] || 0
      if (pa !== pb) return pb - pa
      return b.comprehensiveLevel - a.comprehensiveLevel
    })

    const rarityOrder = { legendary: 3, rare: 2, normal: 1 }
    const sortStones = (a, b) => {
      const diff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
      if (diff !== 0) return diff
      return b.level - a.level
    }

    // ── Phase 1: 给没有符文石的冒险家装备最好的可用符文石 ──
    const unequippedAdventurers = adventurers.filter(a => !a.runeStone)
    const availableStones = runeStones
      .filter(rs => !rs.equippedBy)
      .sort(sortStones)

    for (const adv of unequippedAdventurers) {
      if (availableStones.length === 0) break
      const suitable = availableStones.findIndex(
        rs => rs.level <= adv.comprehensiveLevel
      )
      if (suitable === -1) continue

      const stone = availableStones.splice(suitable, 1)[0]
      await safeExec('装备符文石', () =>
        adventurerService.equipRuneStone(accountId, adv._id, stone._id)
      )
      actions.push(
        `为${adv.name}装备了${getRuneStoneRarityLabel(stone.rarity)}符文石`
      )
    }

    // ── Phase 2: 替换已装备但品质较低的符文石 ──
    const equippedAdventurers = adventurers.filter(a => a.runeStone)
    for (const adv of equippedAdventurers) {
      if (availableStones.length === 0) break
      const currentStone = runeStones.find(
        rs => rs._id.toString() === adv.runeStone.toString()
      )
      if (!currentStone) continue

      const betterIdx = availableStones.findIndex(rs => {
        if (rs.level > adv.comprehensiveLevel) return false
        const curRarity = rarityOrder[currentStone.rarity] || 0
        const newRarity = rarityOrder[rs.rarity] || 0
        if (newRarity > curRarity) return true
        if (newRarity === curRarity && rs.level > currentStone.level)
          return true
        return false
      })
      if (betterIdx === -1) continue

      const betterStone = availableStones.splice(betterIdx, 1)[0]
      await safeExec('替换符文石', () =>
        adventurerService.equipRuneStone(accountId, adv._id, betterStone._id)
      )
      availableStones.push(currentStone)
      availableStones.sort(sortStones)
      actions.push(
        `将${adv.name}的${getRuneStoneRarityLabel(currentStone.rarity)}Lv${currentStone.level}符文石替换为${getRuneStoneRarityLabel(betterStone.rarity)}Lv${betterStone.level}`
      )
    }

    // ── Phase 3: 符文石市场出售 ──
    const ms = bot.marketSettings || {}
    const runeSettings = ms.sellRuneStones || {}
    if (runeSettings.enabled) {
      const maxListCount = runeSettings.maxAmount || 3
      const sellRarities = new Set(runeSettings.rarities || ['legendary'])
      const gameSettings = global.$globalConfig?.gameSettings || {}

      // 当前已上架的符文石
      const myListings = await GameRuneStoneListing.find({
        account: accountId,
        status: 'active'
      })
        .populate('runeStone')
        .lean()

      // 重新获取未装备且未上架的符文石
      const freshStones = await GameRuneStone.find({
        account: accountId,
        equippedBy: null,
        listedOnMarket: { $ne: true }
      }).lean()

      // 筛选可出售的符文石（指定稀有度）
      const sellableStones = freshStones
        .filter(rs => sellRarities.has(rs.rarity))
        .sort(sortStones)

      const currentListedCount = myListings.length

      if (currentListedCount < maxListCount && sellableStones.length > 0) {
        // 还可以挂更多
        const canList = maxListCount - currentListedCount
        const toList = sellableStones.slice(0, canList)

        for (const stone of toList) {
          const listPrice = await getBotRuneStoneListingPrice(
            accountId,
            stone,
            gameSettings
          )

          await safeExec('挂卖符文石', () =>
            marketService.createRuneStoneListing(
              accountId,
              stone._id,
              listPrice
            )
          )
          actions.push(
            `挂卖${getRuneStoneRarityLabel(stone.rarity)}Lv${stone.level}符文石，单价${listPrice}`
          )
        }
      } else if (
        currentListedCount >= maxListCount &&
        sellableStones.length > 0
      ) {
        // 已达到挂单上限，检查是否有更高级的可以替换
        // 按品质从低到高排列当前挂单
        const sortedListings = [...myListings]
          .filter(l => l.runeStone)
          .sort((a, b) => {
            const aStone = a.runeStone
            const bStone = b.runeStone
            const rarityDiff =
              (rarityOrder[aStone.rarity] || 0) -
              (rarityOrder[bStone.rarity] || 0)
            if (rarityDiff !== 0) return rarityDiff
            return aStone.level - bStone.level
          })

        for (const listing of sortedListings) {
          if (sellableStones.length === 0) break
          const listedStone = listing.runeStone
          const betterStone = sellableStones[0]

          // 如果背包里有更好的符文石
          const listedRarity = rarityOrder[listedStone.rarity] || 0
          const betterRarity = rarityOrder[betterStone.rarity] || 0
          const isBetter =
            betterRarity > listedRarity ||
            (betterRarity === listedRarity &&
              betterStone.level > listedStone.level)

          if (!isBetter) continue

          // 下架低级的
          await safeExec('下架符文石', () =>
            marketService.cancelRuneStoneListing(accountId, listing._id)
          )

          // 低级符文石卖给官方变现
          await safeExec('官方出售符文石', () =>
            marketService.sellRuneStoneToOfficial(accountId, listedStone._id)
          )

          // 上架高级的
          const stone = sellableStones.shift()
          const listPrice = await getBotRuneStoneListingPrice(
            accountId,
            stone,
            gameSettings
          )

          await safeExec('挂卖符文石', () =>
            marketService.createRuneStoneListing(
              accountId,
              stone._id,
              listPrice
            )
          )
          actions.push(
            `替换挂卖：下架${getRuneStoneRarityLabel(listedStone.rarity)}Lv${listedStone.level}，上架${getRuneStoneRarityLabel(stone.rarity)}Lv${stone.level}，单价${listPrice}`
          )
        }
      }

      // 收取已完成的符文石交易金币
      const completedListings = await GameRuneStoneListing.find({
        account: accountId,
        status: { $in: ['active', 'completed'] },
        pendingGold: { $gt: 0 }
      }).lean()
      for (const listing of completedListings) {
        await safeExec('收取符文石金币', () =>
          marketService.collectRuneStoneListing(accountId, listing._id)
        )
      }
    }

    // ── Phase 4: 清理剩余未装备未上架的符文石 ──
    const remainingStones = await GameRuneStone.find({
      account: accountId,
      equippedBy: null,
      listedOnMarket: { $ne: true }
    }).lean()
    if (remainingStones.length > 0) {
      let soldCount = 0
      for (let index = 0; index < remainingStones.length; index += 50) {
        const ids = remainingStones.slice(index, index + 50).map(rs => rs._id)
        const result = await safeExec('批量官方出售符文石', () =>
          marketService.batchSellRuneStonesToOfficial(accountId, ids)
        )
        soldCount += result?.soldCount || 0
      }

      if (soldCount > 0) {
        actions.push(`官方出售了${soldCount}个剩余符文石`)
      }
    }

    return actions.length > 0 ? actions.join('；') : null
  })
}

/**
 * 11. 公会升级（共通行动）
 * 自动判断是否满足升级条件（金币 + 满级冒险家数量），可连续升级多次
 */
async function actionGuildUpgrade(accountId) {
  return await safeExec('公会升级', async () => {
    let totalUpgrades = 0
    // 每次tick最多尝试10次连续升级
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await safeExec('公会升级尝试', () =>
        guildService.upgradeGuildLevel(accountId)
      )
      if (result) {
        totalUpgrades++
      } else {
        break
      }
    }
    if (totalUpgrades === 0) return null
    // 获取最新公会等级
    const info = await GamePlayerInfo.findOne({ account: accountId }).lean()
    return `公会升级了${totalUpgrades}次，当前 Lv.${info?.guildLevel || '?'}`
  })
}

/**
 * 12. 阵容管理
 * 自动排布冒险家到5x5网格
 */
async function actionFormationManage(accountId, bot) {
  return await safeExec('阵容管理', async () => {
    const adventurers = await GameAdventurer.find({ account: accountId })
      .sort({ comprehensiveLevel: -1 })
      .lean()
    if (adventurers.length === 0) return null

    // 检查是否已有阵容1
    const existing = await GameFormation.findOne({
      account: accountId,
      slot: 1
    }).lean()

    // 如果已有阵容且全部冒险家都在里面，不需要更新
    if (existing) {
      const existingIds = new Set(
        existing.grid
          .flat()
          .filter(id => id !== null)
          .map(id => id.toString())
      )
      const allInFormation = adventurers.every(a =>
        existingIds.has(a._id.toString())
      )
      if (allInFormation && adventurers.length <= existingIds.size) {
        // 阵容不需要变化，但仍需检查角色分配
        await assignAdventurerRoles(bot, existing.grid, adventurers)
        return null
      }
    }

    // 智能排布：防御型前排，攻击型后排
    const scored = adventurers.slice(0, 25).map(adv => {
      const total =
        adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel
      const frontScore = (adv.defenseLevel + adv.SANLevel) / total
      return { adv, frontScore }
    })
    scored.sort((a, b) => b.frontScore - a.frontScore)

    const grid = Array.from({ length: 5 }, () => Array(5).fill(null))
    let idx = 0
    for (let row = 0; row < 5 && idx < scored.length; row++) {
      for (let col = 0; col < 5 && idx < scored.length; col++) {
        grid[row][col] = scored[idx].adv._id.toString()
        idx++
      }
    }

    await formationService.saveFormation(accountId, 1, '主力阵容', grid)
    const actions = ['更新了主力阵容']

    // 根据阵容倾向分配冒险家角色
    await assignAdventurerRoles(bot, grid, adventurers)

    // 同步更新竞技场阵容（如果已报名）
    const season = await arenaService.getOrCreateActiveSeason()
    if (season) {
      const registration = await GameArenaRegistration.findOne({
        account: accountId,
        season: season._id
      })
      if (registration) {
        const gridIds = new Set(grid.flat().filter(id => id !== null))
        const lockedIds = registration.lockedAdventurers.map(id =>
          id.toString()
        )
        const allLockedPresent = lockedIds.every(id => gridIds.has(id))
        if (allLockedPresent) {
          await safeExec('更新竞技场阵容', () =>
            arenaService.updateFormationPosition(accountId, grid)
          )
          actions.push('更新了竞技场阵容')
        }
      }
    }

    return actions.join('；')
  })
}

/**
 * 根据阵容倾向为冒险家分配角色标签
 * aggressive: 第1排肉盾，第2-5排输出
 * defensive: 第1-3排肉盾，第4-5排输出
 * balanced: 第1-2排肉盾，第3排平均，第4排刺客，第5排输出
 * assassin: 第1排肉盾，第2-5排刺客
 */
async function assignAdventurerRoles(bot, grid, adventurers) {
  const tendency = bot.formationTendency || 'balanced'
  const roles = new Map()

  // 构建每排的角色定义
  let rowRoles
  switch (tendency) {
    case 'aggressive':
      rowRoles = ['tank', 'dps', 'dps', 'dps', 'dps']
      break
    case 'defensive':
      rowRoles = ['tank', 'tank', 'tank', 'dps', 'dps']
      break
    case 'assassin':
      rowRoles = ['tank', 'assassin', 'assassin', 'assassin', 'assassin']
      break
    case 'balanced':
    default:
      rowRoles = ['tank', 'tank', 'balanced', 'assassin', 'dps']
      break
  }

  // 按grid顺序提取所有在阵容中的冒险家ID列表
  const orderedIds = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const advId = grid[row]?.[col]
      if (advId) {
        orderedIds.push(advId.toString())
      }
    }
  }

  // 按冒险家索引均匀分配角色（而非按grid行号）
  const total = orderedIds.length
  for (let i = 0; i < total; i++) {
    const roleIndex = Math.min(Math.floor((i * 5) / total), 4)
    roles.set(orderedIds[i], rowRoles[roleIndex])
  }

  // 不在阵容中的冒险家默认为balanced
  for (const adv of adventurers) {
    const id = adv._id.toString()
    if (!roles.has(id)) {
      roles.set(id, 'balanced')
    }
  }

  // 保存角色分配到bot档案
  bot.adventurerRoles = roles
  await GameBotProfile.updateOne(
    { _id: bot._id },
    { $set: { adventurerRoles: Object.fromEntries(roles) } }
  )

  // 同步设定冒险家的 roleTag（角色标记）
  // bot角色 → roleTag 映射: dps→'1', tank→'2', assassin→'3', balanced→'4'
  const roleToTagMap = { dps: '1', tank: '2', assassin: '3', balanced: '4' }
  const bulkOps = []
  for (const [advId, role] of roles) {
    const tag = roleToTagMap[role] || '4'
    // 只更新需要同步的冒险家（避免不必要的写入）
    const adv = adventurers.find(a => a._id.toString() === advId)
    if (adv && adv.roleTag !== tag) {
      bulkOps.push({
        updateOne: {
          filter: { _id: advId, account: bot.account },
          update: { $set: { roleTag: tag } }
        }
      })
    }
  }
  if (bulkOps.length > 0) {
    await GameAdventurer.bulkWrite(bulkOps)
  }
}

// ─── 主执行逻辑 ────────────────────────────────────

/**
 * 执行单个机器人的一次行动tick
 * @param {object} bot - GameBotProfile文档
 * @returns {string[]} 执行的行动列表
 *
 * 共通行动（每次tick都会执行）：
 * 1. 结算水晶
 * 2. 领取邮件
 * 3. 出售符文石碎片（碎片换金币）
 * 4. 卖水晶换金币（为招募和公会升级准备资金）
 * 5. 招募冒险家（优先招募到公会升级所需数量）
 * 6. 阵容管理（设定冒险家标记，按规则加入阵容）
 * 7. 循环（最多3轮，尽可能花完资源）：
 *    a. 购买水晶（智能用余钱从玩家/官方市场购买短缺水晶）
 *    b. 升级冒险家属性（每轮最多100次升级）
 *    c. 公会升级（可连续升级最多10次）
 *
 * 权重行动（按概率执行）：
 * - 地牢战斗、切换地牢、竞技场、矿场探索、符文石管理
 */
export async function executeBotTick(bot) {
  const accountId = bot.account.toString()
  const weights = bot.behaviorWeights || {}
  const executedActions = []

  const addAction = (action, detail) => {
    if (detail) {
      executedActions.push({ action, detail, timestamp: new Date() })
    }
  }

  // ── 先判断是否发呆（什么都不做）──
  if (shouldAct(weights.idle || 20)) {
    addAction('idle', '本次不做任何事')
    // 发呆时仍然执行共通行动
    addAction('settleCrystals', await actionSettleCrystals(accountId))
    addAction('claimMails', await actionClaimMails(accountId))

    // 更新bot状态
    const idleActions = executedActions.filter(a => a.detail)
    bot.lastTickAt = new Date()
    const existingIdleActions = bot.lastActions || []
    bot.lastActions = [...existingIdleActions, ...idleActions].slice(-100)
    bot.totalActions += idleActions.length
    await bot.save()
    return idleActions
  }

  // ══════════════════════════════════════════════════════
  // Phase 1: 共通行动（每次tick都会执行，不受权重影响）
  // ══════════════════════════════════════════════════════

  // 1.1 结算水晶
  addAction('settleCrystals', await actionSettleCrystals(accountId))

  // 1.2 领取邮件附件
  addAction('claimMails', await actionClaimMails(accountId))

  // 1.3 出售符文石碎片（碎片换金币，为后续操作准备资金）
  addAction('sellRuneFragments', await actionSellRuneFragments(accountId))

  // 1.4 卖水晶换金币（为招募冒险家和公会升级准备金币）
  addAction('sellCrystals', await actionSellCrystals(accountId, bot))

  // 1.5 招募冒险家（优先招募到下次公会升级所需数量）
  addAction('recruitAdventurer', await actionRecruitAdventurer(accountId))

  // 1.6 阵容管理（设定冒险家标记，按规则加入阵容，确保新招募冒险家立即入阵）
  addAction('formationManage', await actionFormationManage(accountId, bot))

  // 1.7-1.9 循环执行：购买水晶 → 升级属性 → 公会升级
  // 循环多轮确保尽可能花完资源，避免屯积
  for (let round = 0; round < 3; round++) {
    const buyResult = await actionBuyCrystals(accountId, bot)
    addAction('buyCrystals', buyResult)

    const levelResult = await actionLevelUpStats(accountId, bot)
    addAction('levelUpStats', levelResult)

    const guildResult = await actionGuildUpgrade(accountId)
    addAction('guildUpgrade', guildResult)

    // 如果本轮没有任何操作执行成功，停止循环
    if (!buyResult && !levelResult && !guildResult) break
  }

  // ══════════════════════════════════════════════════════
  // Phase 2: 战斗类行动（按权重执行）
  // ══════════════════════════════════════════════════════

  // 地牢战斗（挑战军团升级迷宫等级）
  if (shouldAct(weights.dungeonBattle || 70)) {
    addAction('dungeonBattle', await actionDungeonBattle(accountId))
  }

  // 切换地牢
  if (shouldAct(weights.switchDungeon || 40)) {
    addAction('switchDungeon', await actionSwitchDungeon(accountId))
  }

  // 竞技场
  if (shouldAct(weights.arenaBattle || 60)) {
    addAction('arena', await actionArena(accountId))
  }

  // ══════════════════════════════════════════════════════
  // Phase 3: 探索与资源管理（按权重执行）
  // ══════════════════════════════════════════════════════

  // 矿场探索
  if (shouldAct(weights.mineExplore || 50)) {
    addAction('mineExplore', await actionMineExplore(accountId))
  }

  // 符文石管理
  if (shouldAct(weights.runeStoneManage || 50)) {
    addAction('runeStoneManage', await actionRuneStoneManage(accountId, bot))
  }

  // ══════════════════════════════════════════════════════
  // 保存 bot 状态
  // ══════════════════════════════════════════════════════

  const finalActions = executedActions.filter(a => a.detail)
  bot.lastTickAt = new Date()
  // 追加到历史记录，保留最近100条
  const existingActions = bot.lastActions || []
  bot.lastActions = [...existingActions, ...finalActions].slice(-100)
  bot.totalActions += finalActions.length
  await bot.save()

  return finalActions
}

/**
 * 批量执行所有活跃机器人的行动
 * 在 cron job 中调用，错开执行避免服务器压力
 */
export async function executeAllBotTicks() {
  const currentHour = new Date().getHours()

  const bots = await GameBotProfile.find({ isActive: true }).lean()
  if (bots.length === 0) {
    logger.info('[Bot] 没有活跃的机器人')
    return
  }

  // 按活动时间过滤
  const activeBots = bots.filter(bot => {
    const ats = bot.activeTimeSettings || {}
    // 如果未启用活动时间限制，则24小时活动
    if (ats.enabled === false) return true
    const startHour = ats.startHour ?? 8
    const endHour = ats.endHour ?? 23
    if (startHour <= endHour) {
      // 正常范围，如 8-23
      return currentHour >= startHour && currentHour < endHour
    } else {
      // 跨天范围，如 22-6（22:00到次日6:00）
      return currentHour >= startHour || currentHour < endHour
    }
  })

  if (activeBots.length === 0) {
    logger.info(
      `[Bot] 当前时间(${currentHour}:00)没有处于活动时段的机器人，跳过`
    )
    return
  }

  logger.info(
    `[Bot] 开始调度 ${activeBots.length} 个机器人的行动（共 ${bots.length} 个活跃）...`
  )

  // 每个机器人分配0-30分钟的随机延迟，分散服务器压力
  for (const bot of activeBots) {
    const delayMs = Math.floor(Math.random() * 30 * 60 * 1000)
    const delayMin = (delayMs / 60000).toFixed(1)
    logger.info(`[Bot] ${bot._id} 将在 ${delayMin} 分钟后执行`)

    setTimeout(async () => {
      try {
        await executeInLock(`bot-tick:${bot._id}`, async () => {
          const botDoc = await GameBotProfile.findById(bot._id)
          if (!botDoc || !botDoc.isActive) return

          const actions = await executeBotTick(botDoc)
          logger.info(`[Bot] ${bot._id} 执行了 ${actions.length} 个动作`)
        })
      } catch (err) {
        logger.error(`[Bot] ${bot._id} 执行失败: ${err.message}`)
      }
    }, delayMs)
  }

  logger.info('[Bot] 所有机器人行动已调度完毕')
}
