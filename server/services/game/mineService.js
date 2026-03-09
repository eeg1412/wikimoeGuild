import mongoose from 'mongoose'
import GameMine from '../../models/gameMine.js'
import GameMineRevenue from '../../models/gameMineRevenue.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameFormation from '../../models/gameFormation.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import { executeInLock } from '../../utils/utils.js'
import { recordActivity } from './activityService.js'
import { executeBattle } from './battleEngine.js'
import * as runeStoneService from './runeStoneService.js'
import {
  getRandomDemonAvatarId,
  generateRandomDemonName
} from 'shared/utils/utils.js'
import {
  runeStoneActiveSkillDataBase,
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import { NPC_FREE_ALLOC_COUNT } from 'shared/constants/index.js'

// SSE 连接管理：mineId → Set<{ res, accountId }>
const sseClients = new Map()

// 发现矿场概率（万分之）
const MINE_DISCOVERY_RATE = 1000
// 每10级最多2个矿场
const MAX_MINES_PER_BRACKET = 2

/**
 * 计算等级区间
 * level 1-10 → 1, 11-20 → 2, ...
 */
function getLevelBracket(level) {
  return Math.ceil(level / 10)
}

/**
 * 生成扫雷棋盘（10x10），10-30 个奖励区域
 */
function generateMineGrid() {
  const SIZE = 10
  const rewardCount = Math.floor(Math.random() * 21) + 10 // 10-30
  const grid = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({
      type: 'number',
      adjacentRewards: 0,
      revealed: false,
      exploredBy: null,
      exploredByGuildName: null,
      challengeDefeated: false
    }))
  )

  // 随机放置奖励区域
  const positions = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      positions.push([r, c])
    }
  }
  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  const rewardPositions = positions.slice(0, rewardCount)
  for (const [r, c] of rewardPositions) {
    grid[r][c].type = 'reward'
  }

  // 计算每个数字格子周围的奖励数
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
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].type === 'reward') continue
      let count = 0
      for (const [dr, dc] of DIRS) {
        const nr = r + dr
        const nc = c + dc
        if (
          nr >= 0 &&
          nr < SIZE &&
          nc >= 0 &&
          nc < SIZE &&
          grid[nr][nc].type === 'reward'
        ) {
          count++
        }
      }
      grid[r][c].adjacentRewards = count
    }
  }

  return { grid, totalRewards: rewardCount }
}

/**
 * 尝试在切换迷宫时发现矿场
 * @param {string} accountId
 * @param {number} dungeonLevel - 当前迷宫等级
 * @param {object} crystalRates - 当前水晶概率
 * @returns {object|null} 发现的矿场或null
 */
export async function tryDiscoverMine(accountId, dungeonLevel, crystalRates) {
  // 概率判定
  const roll = Math.floor(Math.random() * 10000)
  if (roll >= MINE_DISCOVERY_RATE) return null

  const bracket = getLevelBracket(dungeonLevel)

  // 检查该等级区间的矿场数量
  const bracketCount = await GameMine.countDocuments({
    levelBracket: bracket,
    depleted: false
  })
  if (bracketCount >= MAX_MINES_PER_BRACKET) return null

  // 使用锁确保并发安全，防止超量创建
  return await executeInLock(`mine-discover:${bracket}`, async () => {
    // 双重检查
    const doubleCheck = await GameMine.countDocuments({
      levelBracket: bracket,
      depleted: false
    })
    if (doubleCheck >= MAX_MINES_PER_BRACKET) return null

    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) return null

    const { grid, totalRewards } = generateMineGrid()

    const mine = await GameMine.create({
      owner: accountId,
      ownerGuildName: playerInfo.guildName,
      level: dungeonLevel,
      levelBracket: bracket,
      grid,
      totalRewards,
      crystalRates: crystalRates || {
        attackCryRate: 2500,
        defenseCryRate: 2500,
        speedCryRate: 2500,
        SANCryRate: 2500
      }
    })

    // 记录动态：发现矿场
    recordActivity({
      type: 'mine_discovered',
      account: accountId,
      guildName: playerInfo.guildName,
      title: `「${playerInfo.guildName}」发现了 Lv.${dungeonLevel} 矿场`,
      content: '探索迷宫时发现了新矿场！',
      extra: { mineId: mine._id, level: dungeonLevel }
    })

    return mine
  })
}

/**
 * 获取矿场列表（支持按等级筛选）
 */
export async function listMines({
  page = 1,
  pageSize = 20,
  minLevel,
  maxLevel
} = {}) {
  page = Math.max(page, 1)
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const filter = { depleted: false }
  if (minLevel) filter.level = { ...filter.level, $gte: parseInt(minLevel) }
  if (maxLevel) filter.level = { ...filter.level, $lte: parseInt(maxLevel) }

  const total = await GameMine.countDocuments(filter)
  const list = await GameMine.find(filter)
    .sort({ level: 1, createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('ownerGuildName level totalRewards exploredRewards createdAt')
    .lean()

  return { list, total }
}

/**
 * 获取矿场详情（含棋盘状态，隐藏未探索格子的内部数据）
 */
export async function getMineDetail(mineId) {
  const mine = await GameMine.findById(mineId).lean()
  if (!mine) {
    const err = new Error('矿场不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  if (mine.depleted) {
    const err = new Error('矿场已废弃')
    err.statusCode = 410
    err.expose = true
    throw err
  }

  // 返回棋盘，但隐藏未探索格子的类型信息（仅显示是否已探索），不泄漏内部accountId
  const safeGrid = mine.grid.map(row =>
    row.map(cell => {
      if (cell.revealed) {
        return {
          type: cell.type,
          adjacentRewards:
            cell.type === 'number' ? cell.adjacentRewards : undefined,
          revealed: true,
          exploredByGuildName: cell.exploredByGuildName,
          challengeDefeated: cell.challengeDefeated
        }
      }
      return { revealed: false }
    })
  )

  return {
    _id: mine._id,
    ownerGuildName: mine.ownerGuildName,
    level: mine.level,
    totalRewards: mine.totalRewards,
    exploredRewards: mine.exploredRewards,
    crystalRates: mine.crystalRates,
    grid: safeGrid,
    createdAt: mine.createdAt
  }
}

/**
 * 恢复挖矿次数（内部使用）
 */
function recoverMiningUses(playerInfo) {
  const now = Date.now()
  const lastRecover = new Date(playerInfo.lastMiningRecoverAt || now).getTime()
  const hoursElapsed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
  if (hoursElapsed > 0) {
    playerInfo.miningCanUses = Math.min(
      playerInfo.miningCanUses + hoursElapsed,
      24
    )
    playerInfo.lastMiningRecoverAt = new Date(
      lastRecover + hoursElapsed * 60 * 60 * 1000
    )
  }
  return playerInfo.miningCanUses
}

/**
 * 找出击杀数最高的冒险家（矿场战斗用）
 */
function findTopKillers(battleResult, playerGrid) {
  const killCount = new Map()
  const nameMap = new Map()
  const avatarMap = new Map()

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const adv = playerGrid[r]?.[c]
      if (adv) {
        const id = adv._id?.toString() || adv._id
        nameMap.set(id, adv.name)
        avatarMap.set(id, {
          defaultAvatarId: adv.defaultAvatarId,
          hasCustomAvatar: adv.hasCustomAvatar,
          elements: adv.elements
        })
      }
    }
  }

  if (battleResult.log) {
    for (const entry of battleResult.log) {
      if (entry.type === 'attack' && entry.defenderRemainSan === 0) {
        const attackerId = entry.attacker
        if (nameMap.has(attackerId)) {
          killCount.set(attackerId, (killCount.get(attackerId) || 0) + 1)
        }
      }
      if (entry.type === 'runeStoneSkill' && entry.effects) {
        for (const effect of entry.effects) {
          if (effect.targetRemainSan === 0 && nameMap.has(entry.caster)) {
            killCount.set(entry.caster, (killCount.get(entry.caster) || 0) + 1)
          }
        }
      }
    }
  }

  const sorted = [...killCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  if (sorted.length === 0) return []
  const maxKills = sorted[0][1]

  return sorted
    .filter(([, kills]) => kills === maxKills)
    .map(([id, kills]) => ({
      adventurerId: id,
      name: nameMap.get(id) || '未知',
      kills,
      ...avatarMap.get(id)
    }))
}

/**
 * 挖矿（探索格子）
 */
export async function digCell(accountId, mineId, row, col, formationSlot) {
  // 参数验证
  if (row < 0 || row > 9 || col < 0 || col > 9) {
    const err = new Error('无效的坐标')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 使用矿场级锁确保并发安全（整个矿场一把锁，防止并发写入grid丢失和挖矿次数绕过）
  return await executeInLock(`mine-dig:${mineId}`, async () => {
    const mine = await GameMine.findById(mineId)
    if (!mine || mine.depleted) {
      const err = new Error('矿场不存在或已废弃')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const cell = mine.grid[row][col]

    // 如果格子已被探索且不是失败的奖励区域挑战
    if (cell.revealed && !(cell.type === 'reward' && !cell.challengeDefeated)) {
      const err = new Error('该格子已被探索')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    // 奖励区域挑战冷却（10秒）
    if (cell.type === 'reward') {
      if (playerInfo.lastBattleAt) {
        const cooldownMs =
          Date.now() - new Date(playerInfo.lastBattleAt).getTime()
        if (cooldownMs < 10000) {
          const remainSec = Math.ceil((10000 - cooldownMs) / 1000)
          const err = new Error(`对战冷却中，请等待 ${remainSec} 秒`)
          err.statusCode = 429
          err.expose = true
          throw err
        }
      }
    }

    // 已探索的奖励区域（失败挑战）不消耗挖矿次数
    const isRetryRewardChallenge =
      cell.revealed && cell.type === 'reward' && !cell.challengeDefeated
    if (!isRetryRewardChallenge) {
      // 恢复并检查挖矿次数
      recoverMiningUses(playerInfo)
      if (playerInfo.miningCanUses <= 0) {
        const err = new Error('挖矿次数不足，每小时恢复1次')
        err.statusCode = 400
        err.expose = true
        throw err
      }
      playerInfo.miningCanUses -= 1
    }

    let result = {
      row,
      col,
      type: cell.type,
      mineLevel: mine.level,
      crystals: null,
      battleResult: null,
      runeStone: null,
      topKillers: null,
      mineDepleted: false
    }

    if (cell.type === 'number') {
      // 数字格子：获得水晶
      cell.revealed = true
      cell.exploredBy = accountId
      cell.exploredByGuildName = playerInfo.guildName
      result.adjacentRewards = cell.adjacentRewards

      if (cell.adjacentRewards > 0) {
        const totalCrystals = cell.adjacentRewards * 10
        const crystalResult = await awardCrystals(
          accountId,
          totalCrystals,
          mine
        )
        result.crystals = crystalResult

        // 矿主收益
        if (mine.owner.toString() !== accountId) {
          await awardOwnerRevenue(
            mine,
            accountId,
            playerInfo.guildName,
            crystalResult
          )
        }
      }
    } else {
      // 奖励区域：战斗
      if (!formationSlot) {
        // 恢复挖矿机会（因为没消耗）
        if (!isRetryRewardChallenge) {
          playerInfo.miningCanUses += 1
        }
        await playerInfo.save()
        const err = new Error('挑战奖励区域需要选择阵容')
        err.statusCode = 400
        err.expose = true
        throw err
      }

      playerInfo.lastBattleAt = new Date()

      // 加载玩家阵容
      const formation = await GameFormation.findOne({
        account: accountId,
        slot: formationSlot
      })
      if (!formation) {
        if (!isRetryRewardChallenge) {
          playerInfo.miningCanUses += 1
        }
        await playerInfo.save()
        const err = new Error('阵容不存在')
        err.statusCode = 400
        err.expose = true
        throw err
      }

      const adventurerIds = formation.grid.flat().filter(id => id !== null)
      if (adventurerIds.length === 0) {
        if (!isRetryRewardChallenge) {
          playerInfo.miningCanUses += 1
        }
        await playerInfo.save()
        const err = new Error('阵容中没有冒险家')
        err.statusCode = 400
        err.expose = true
        throw err
      }

      const adventurers = await GameAdventurer.find({
        _id: { $in: adventurerIds },
        account: accountId
      })
        .populate('runeStone')
        .lean()

      const advMap = new Map()
      for (const adv of adventurers) {
        advMap.set(adv._id.toString(), adv)
      }
      const playerGrid = formation.grid.map(row =>
        row.map(id => (id ? advMap.get(id.toString()) || null : null))
      )

      // 生成军团（同等级迷宫军团逻辑）
      const demonGrid = generateMineLegion(mine.level)

      // 执行战斗
      const allSkillsDB = runeStoneActiveSkillDataBase()
      const battleResult = executeBattle(playerGrid, demonGrid, allSkillsDB)
      result.battleResult = {
        winner: battleResult.winner,
        rounds: battleResult.rounds,
        log: battleResult.log,
        attackerUnits: battleResult.attackerUnits,
        defenderUnits: battleResult.defenderUnits
      }

      // 矿场守卫战必须全歼敌方才算胜利，HP 比例胜利不算
      const allMinDefendersDead = !battleResult.defenderUnits.some(u => u.alive)
      if (battleResult.winner === 'attacker' && allMinDefendersDead) {
        // 胜利
        cell.revealed = true
        cell.exploredBy = accountId
        cell.exploredByGuildName = playerInfo.guildName
        cell.challengeDefeated = true
        mine.exploredRewards += 1

        // 奖励：100个水晶 + 1个符文石
        const crystalResult = await awardCrystals(accountId, 100, mine)
        result.crystals = crystalResult

        // 矿主收益（水晶）
        if (mine.owner.toString() !== accountId) {
          await awardOwnerRevenue(
            mine,
            accountId,
            playerInfo.guildName,
            crystalResult
          )
        }

        // 符文石（矿场奖励区域必掉，使用符文石稀有度概率算法）
        const gameSettings = global.$globalConfig?.gameSettings || {}
        const normalRate = gameSettings.normalRuneStoneRate ?? 8000
        const rareRate = gameSettings.rareRuneStoneRate ?? 1500
        const legendaryRate = gameSettings.legendaryRuneStoneRate ?? 500
        const totalRarityRate = normalRate + rareRate + legendaryRate
        const rarityRoll = Math.floor(Math.random() * totalRarityRate)
        let rarity
        if (rarityRoll < normalRate) rarity = 'normal'
        else if (rarityRoll < normalRate + rareRate) rarity = 'rare'
        else rarity = 'legendary'
        result.runeStone = await runeStoneService.generateRuneStone(
          accountId,
          rarity,
          mine.level
        )

        // 找出全场最佳
        const topKillers = findTopKillers(battleResult, playerGrid)
        result.topKillers = topKillers

        // 记录动态：矿场击败守卫获得符文石
        const rarityLabels = { normal: '普通', rare: '稀有', legendary: '传说' }
        recordActivity({
          type: 'rune_stone_found',
          account: accountId,
          guildName: playerInfo.guildName,
          title: `⛏️ 「${playerInfo.guildName}」攻破了 Lv.${mine.level} 矿场的守卫！`,
          content: `在 Lv.${mine.level} 矿场击败守卫，获得了一颗${rarityLabels[rarity]}符文石！`,
          extra: { rarity, mineLevel: mine.level, topKillers }
        })

        // 检查矿场是否废弃
        if (mine.exploredRewards >= mine.totalRewards) {
          mine.depleted = true
          result.mineDepleted = true
        }
      } else {
        // 失败或未全歼：标记为已显示但未攻克
        cell.revealed = true
        cell.exploredBy = accountId
        cell.exploredByGuildName = playerInfo.guildName
        cell.challengeDefeated = false
        result.challengeFailed = true
        // 区分「战斗获胜但未全歼」和「直接败北」，前端用于显示不同的提示
        if (battleResult.winner === 'attacker') {
          result.partialVictory = true
        }
      }
    }

    // 标记 grid 为已修改
    mine.markModified('grid')
    await mine.save()
    await playerInfo.save()

    // 通知 SSE 客户端（不泄漏内部accountId）
    broadcastMineUpdate(mineId.toString(), {
      type: 'cellUpdate',
      row,
      col,
      cell: {
        type: cell.type,
        adjacentRewards:
          cell.type === 'number' ? cell.adjacentRewards : undefined,
        revealed: cell.revealed,
        exploredByGuildName: cell.exploredByGuildName,
        challengeDefeated: cell.challengeDefeated
      },
      exploredRewards: mine.exploredRewards,
      depleted: mine.depleted
    })

    return result
  })
}

/**
 * 按概率分配水晶
 */
async function awardCrystals(accountId, totalAmount, mine) {
  const rates = mine.crystalRates || {
    attackCryRate: 2500,
    defenseCryRate: 2500,
    speedCryRate: 2500,
    SANCryRate: 2500
  }
  const totalRate =
    rates.attackCryRate +
    rates.defenseCryRate +
    rates.speedCryRate +
    rates.SANCryRate
  const attackCrystals = Math.floor(
    (totalAmount * rates.attackCryRate) / totalRate
  )
  const defenseCrystals = Math.floor(
    (totalAmount * rates.defenseCryRate) / totalRate
  )
  const speedCrystals = Math.floor(
    (totalAmount * rates.speedCryRate) / totalRate
  )
  const sanCrystals = Math.floor((totalAmount * rates.SANCryRate) / totalRate)

  // 修正取整误差
  const allocated =
    attackCrystals + defenseCrystals + speedCrystals + sanCrystals
  const remainder = totalAmount - allocated

  const result = {
    attackCrystal: attackCrystals,
    defenseCrystal: defenseCrystals,
    speedCrystal: speedCrystals,
    sanCrystal: sanCrystals
  }

  // 余量分给第一个非零概率的水晶
  if (remainder > 0) {
    if (rates.attackCryRate > 0) result.attackCrystal += remainder
    else if (rates.defenseCryRate > 0) result.defenseCrystal += remainder
    else if (rates.speedCryRate > 0) result.speedCrystal += remainder
    else result.sanCrystal += remainder
  }

  await GamePlayerInventory.findOneAndUpdate(
    { account: accountId },
    {
      $inc: {
        attackCrystal: result.attackCrystal,
        defenseCrystal: result.defenseCrystal,
        speedCrystal: result.speedCrystal,
        sanCrystal: result.sanCrystal
      }
    },
    { upsert: true }
  )

  return result
}

/**
 * 矿主收益（每次有玩家获得水晶时，矿主获得10个同种水晶）
 */
async function awardOwnerRevenue(
  mine,
  triggeredByAccountId,
  triggeredByGuildName,
  crystalResult
) {
  const ownerId = mine.owner
  const increments = {}
  const revenueEntries = []

  for (const [crystalType, amount] of Object.entries(crystalResult)) {
    if (amount > 0) {
      increments[crystalType] = 10
      revenueEntries.push({
        owner: ownerId,
        mine: mine._id,
        triggeredBy: triggeredByAccountId,
        triggeredByGuildName,
        crystalType,
        crystalAmount: 10
      })
    }
  }

  if (Object.keys(increments).length > 0) {
    await GamePlayerInventory.findOneAndUpdate(
      { account: ownerId },
      { $inc: increments },
      { upsert: true }
    )
    await GameMineRevenue.insertMany(revenueEntries)
  }
}

/**
 * 生成矿场军团（同等级迷宫军团逻辑）
 * 等级增强系数: 1 + level * 0.001（每级+0.1%）
 */
function generateMineLegion(level) {
  const ELEMENTS = ['1', '2', '3', '4', '5', '6']
  const allBuffTypes = passiveBuffTypeDataBase()
  const allPreferences = attackPreferenceDataBase()
  const allSkills = runeStoneActiveSkillDataBase()
  // 等级增强系数：基于矿场等级的小幅增强曲线
  const levelBoostFactor = 1 + level * 0.001

  const demons = []

  //  前10级：迷宫等级 数量的 等级为 迷宫等级×1 的恶魔
  if (level <= 10) {
    const demonCount = Math.min(level, 10)
    const compLevel = Math.max(1, Math.floor(level * 1 * levelBoostFactor))
    for (let i = 0; i < demonCount; i++) {
      demons.push(
        createMineDemon(compLevel, ELEMENTS, allBuffTypes, allPreferences, null)
      )
    }
  } else if (level <= 25) {
    // 前25级：迷宫等级 数量的恶魔，等级为 迷宫等级 × 1，必定携带1个随机传说级符文石
    const demonCount = Math.min(level, 25)
    const compLevel = Math.max(1, Math.floor(level * 1 * levelBoostFactor))
    for (let i = 0; i < demonCount; i++) {
      const runeStone = generateMineDemonRuneStone(compLevel, allSkills)
      demons.push(
        createMineDemon(
          compLevel,
          ELEMENTS,
          allBuffTypes,
          allPreferences,
          runeStone
        )
      )
    }
  } else {
    // 后25级：25名恶魔，综合等级 = 矿场等级 × 增强系数
    // 前10名（前2排）极端偏向防御/SAN，中间5名（第3排）均衡加点，后10名（后2排）极端偏向攻击/速度
    // 后4排（索引5-24）中随机 NPC_FREE_ALLOC_COUNT 名使用均衡自由分配
    const freeAllocIndices = new Set()
    while (freeAllocIndices.size < Math.min(NPC_FREE_ALLOC_COUNT, 20)) {
      freeAllocIndices.add(5 + Math.floor(Math.random() * 20))
    }
    for (let i = 0; i < 25; i++) {
      const compLevel = Math.max(1, Math.floor(level * levelBoostFactor))
      const runeStone = generateMineDemonRuneStone(compLevel, allSkills)
      const role = freeAllocIndices.has(i)
        ? 'balanced'
        : i < 10
          ? 'frontTank'
          : i < 15
            ? 'balanced'
            : 'backDPS'
      demons.push(
        createMineDemon(
          compLevel,
          ELEMENTS,
          allBuffTypes,
          allPreferences,
          runeStone,
          role
        )
      )
    }
  }

  const grid = Array.from({ length: 5 }, () => Array(5).fill(null))
  let idx = 0
  for (let row = 0; row < 5 && idx < demons.length; row++) {
    for (let col = 0; col < 5 && idx < demons.length; col++) {
      grid[row][col] = demons[idx]
      idx++
    }
  }

  return grid
}

/**
 * 前排属性分配（极端偏向防御和SAN）
 * 防御/SAN各占45%，攻击/速度各占5%
 */
function distributeStatLevelsMineFrontRow(comprehensiveLevel) {
  const remaining = Math.max(comprehensiveLevel - 1, 0)
  const parts = [0, 0, 0, 0] // [attack, defense, speed, san]
  for (let i = 0; i < remaining; i++) {
    const r = Math.random()
    if (r < 0.05)
      parts[0]++ // 5% 攻击
    else if (r < 0.5)
      parts[1]++ // 45% 防御
    else if (r < 0.55)
      parts[2]++ // 5% 速度
    else parts[3]++ // 45% SAN
  }
  return [parts[0] + 1, parts[1] + 1, parts[2] + 1, parts[3] + 1]
}

/**
 * 后排属性分配（极端偏向攻击和速度）
 * 攻击/速度各占45%，防御/SAN各占5%
 */
function distributeStatLevelsMineBackRow(comprehensiveLevel) {
  const remaining = Math.max(comprehensiveLevel - 1, 0)
  const parts = [0, 0, 0, 0] // [attack, defense, speed, san]
  for (let i = 0; i < remaining; i++) {
    const r = Math.random()
    if (r < 0.45)
      parts[0]++ // 45% 攻击
    else if (r < 0.5)
      parts[1]++ // 5% 防御
    else if (r < 0.95)
      parts[2]++ // 45% 速度
    else parts[3]++ // 5% SAN
  }
  return [parts[0] + 1, parts[1] + 1, parts[2] + 1, parts[3] + 1]
}

function createMineDemon(
  comprehensiveLevel,
  elements,
  allBuffTypes,
  allPreferences,
  runeStone,
  role = 'balanced'
) {
  const element = elements[Math.floor(Math.random() * elements.length)]
  const passiveBuff =
    allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)]
  const preference =
    allPreferences[Math.floor(Math.random() * allPreferences.length)]

  let statParts
  if (role === 'frontTank') {
    statParts = distributeStatLevelsMineFrontRow(comprehensiveLevel)
  } else if (role === 'backDPS') {
    statParts = distributeStatLevelsMineBackRow(comprehensiveLevel)
  } else {
    const remaining = Math.max(comprehensiveLevel - 1, 0)
    const rawParts = [0, 0, 0, 0]
    for (let i = 0; i < remaining; i++) {
      rawParts[Math.floor(Math.random() * 4)]++
    }
    statParts = rawParts.map(p => p + 1)
  }

  return {
    _id: `mine_demon_${Math.random().toString(36).slice(2, 10)}`,
    name: generateRandomDemonName(),
    elements: element,
    passiveBuffType: passiveBuff.value,
    attackPreference: preference.value,
    defaultAvatarId: getRandomDemonAvatarId(),
    attackLevel: statParts[0],
    defenseLevel: statParts[1],
    speedLevel: statParts[2],
    SANLevel: statParts[3],
    comprehensiveLevel,
    runeStone,
    isDemon: true
  }
}

function distributeMineLevels(totalLevel, count) {
  const levels = new Array(count).fill(1)
  let remaining = Math.max(totalLevel - count, 0)
  while (remaining > 0) {
    const idx = Math.floor(Math.random() * count)
    levels[idx]++
    remaining--
  }
  return levels
}

function generateMineDemonRuneStone(level, allSkills) {
  const shuffledSkills = [...allSkills].sort(() => Math.random() - 0.5)
  const activeSkills = shuffledSkills
    .slice(0, 3)
    .map(s => ({ skillId: s.value }))
  const buffTypes = ['attack', 'defense', 'speed', 'san']
  const passiveBuffs = []
  for (let i = 0; i < 6; i++) {
    passiveBuffs.push({
      buffType: buffTypes[Math.floor(Math.random() * 4)],
      buffLevel: Math.floor(Math.random() * 10) + 21
    })
  }
  return {
    rarity: 'legendary',
    level: Math.max(level, 1),
    activeSkills,
    passiveBuffs
  }
}

/**
 * 获取矿主收益（近7天）
 */
export async function getOwnerRevenue(
  accountId,
  { page = 1, pageSize = 20 } = {}
) {
  page = Math.max(page, 1)
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const filter = { owner: accountId, createdAt: { $gte: sevenDaysAgo } }

  const total = await GameMineRevenue.countDocuments(filter)
  const list = await GameMineRevenue.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('triggeredByGuildName crystalType crystalAmount mine createdAt')
    .lean()

  // 汇总统计（近7天，aggregate需要ObjectId格式）
  const ownerObjectId = new mongoose.Types.ObjectId(accountId)
  const summary = await GameMineRevenue.aggregate([
    { $match: { owner: ownerObjectId, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: '$crystalType',
        totalAmount: { $sum: '$crystalAmount' }
      }
    }
  ])

  const summaryMap = {}
  for (const s of summary) {
    summaryMap[s._id] = s.totalAmount
  }

  return { list, total, summary: summaryMap }
}

/**
 * 获取矿场挖矿信息（当前挖矿次数等）
 */
export async function getMiningInfo(accountId) {
  const playerInfo = await GamePlayerInfo.findOne({ account: accountId }).lean()
  if (!playerInfo) {
    const err = new Error('玩家信息不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const now = Date.now()
  const lastRecover = new Date(playerInfo.lastMiningRecoverAt || now).getTime()
  const hoursElapsed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
  const currentUses = Math.min(playerInfo.miningCanUses + hoursElapsed, 24)
  const nextRecoverIn =
    60 * 60 * 1000 - ((now - lastRecover) % (60 * 60 * 1000))

  return {
    miningCanUses: currentUses,
    nextRecoverIn: Math.ceil(nextRecoverIn / 1000)
  }
}

// ===== SSE 管理 =====

// 每个用户对每个矿场最大连接数
const MAX_SSE_PER_USER_PER_MINE = 2

/**
 * 注册 SSE 连接（限制每用户每矿场最多2个连接，超出时关闭旧连接）
 */
export function registerSSEClient(mineId, accountId, res) {
  if (!sseClients.has(mineId)) {
    sseClients.set(mineId, new Set())
  }
  const clients = sseClients.get(mineId)

  // 检查同一用户已有连接数，超出时关闭最早的
  const userClients = [...clients].filter(c => c.accountId === accountId)
  while (userClients.length >= MAX_SSE_PER_USER_PER_MINE) {
    const oldClient = userClients.shift()
    try {
      oldClient.res.end()
    } catch {
      /* 忽略 */
    }
    clients.delete(oldClient)
  }

  const client = { res, accountId }
  clients.add(client)

  // 清理断开的连接
  res.on('close', () => {
    const clientSet = sseClients.get(mineId)
    if (clientSet) {
      clientSet.delete(client)
      if (clientSet.size === 0) {
        sseClients.delete(mineId)
      }
    }
  })
}

/**
 * 广播矿场更新
 */
function broadcastMineUpdate(mineId, data) {
  const clients = sseClients.get(mineId)
  if (!clients || clients.size === 0) return

  const message = `data: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    try {
      client.res.write(message)
    } catch {
      // 连接已断开，忽略
    }
  }
}
