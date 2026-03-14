import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import GameFormation from '../../models/gameFormation.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import { executeInLock } from '../../utils/utils.js'
import {
  getRandomDemonAvatarId,
  generateRandomDemonName
} from 'shared/utils/utils.js'
import { executeBattle } from './battleEngine.js'
import * as runeStoneService from './runeStoneService.js'
import {
  runeStoneActiveSkillDataBase,
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import { recordActivity } from './activityService.js'
import {
  NPC_FREE_ALLOC_COUNT,
  BATTLE_COOLDOWN_SECONDS,
  RUNE_STONE_DECOMPOSE_NORMAL_BASE,
  RUNE_STONE_DECOMPOSE_RARE_BASE,
  RUNE_STONE_DECOMPOSE_LEGENDARY_BASE
} from 'shared/constants/index.js'

/**
 * 简易种子随机数生成器 (mulberry32)
 * 确保同一种子生成的随机序列一致
 */
function createSeededRandom(seed) {
  let t = seed >>> 0
  return function () {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 根据 accountId + dungeonLevel 生成一致的种子
 */
function generateSeed(accountId, dungeonLevel) {
  const str = `${accountId}_${dungeonLevel}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/**
 * 生成军团恶魔（使用种子随机数确保一致性）
 * 前10级：迷宫等级 数量的 等级为 迷宫等级×1 的恶魔
 * 前25级：迷宫等级 数量的 等级为 迷宫等级×1 的恶魔，必定携带1个随机传说级符文石
 * 后25级：25名恶魔，综合等级 = 迷宫等级，全员持有传说级符文石
 * 等级增强系数: 1 + level * 0.001（每级+0.1%）
 */
function generateLegionDemons(dungeonLevel, seededRandom) {
  const ELEMENTS = ['1', '2', '3', '4', '5', '6']
  const allBuffTypes = passiveBuffTypeDataBase()
  const allPreferences = attackPreferenceDataBase()
  const allSkills = runeStoneActiveSkillDataBase()
  // 等级增强系数：基于迷宫等级的小幅增强曲线
  const levelBoostFactor = 1 + dungeonLevel * 0.001

  const demons = []
  if (dungeonLevel <= 10) {
    // 前10级：迷宫等级 数量的恶魔，等级为 迷宫等级 × 1
    const demonCount = Math.min(dungeonLevel, 10)
    const compLevel = Math.max(
      1,
      Math.floor(dungeonLevel * 1 * levelBoostFactor)
    )
    for (let i = 0; i < demonCount; i++) {
      demons.push(
        createDemon(
          compLevel,
          ELEMENTS,
          allBuffTypes,
          allPreferences,
          null,
          allSkills,
          seededRandom
        )
      )
    }
  } else if (dungeonLevel <= 25) {
    // 前25级：迷宫等级 数量的恶魔，等级为 迷宫等级 × 1
    const demonCount = Math.min(dungeonLevel, 25)
    const compLevel = Math.max(
      1,
      Math.floor(dungeonLevel * 1 * levelBoostFactor)
    )
    for (let i = 0; i < demonCount; i++) {
      // 必定携带1个随机传说级符文石
      const runeStone = generateDemonRuneStone(
        compLevel,
        allSkills,
        seededRandom
      )
      demons.push(
        createDemon(
          compLevel,
          ELEMENTS,
          allBuffTypes,
          allPreferences,
          runeStone,
          allSkills,
          seededRandom
        )
      )
    }
  } else {
    // 后25级：25名恶魔，综合等级 = 迷宫等级 × 增强系数
    // 前10名（前2排）极端偏向防御/SAN，中间5名（第3排）均衡加点，后10名（后2排）极端偏向攻击/速度
    // 后4排（索引5-24）中随机 NPC_FREE_ALLOC_COUNT 名使用均衡自由分配
    const freeAllocIndices = new Set()
    while (freeAllocIndices.size < Math.min(NPC_FREE_ALLOC_COUNT, 20)) {
      freeAllocIndices.add(5 + Math.floor(seededRandom() * 20))
    }
    for (let i = 0; i < 25; i++) {
      const compLevel = Math.max(1, Math.floor(dungeonLevel * levelBoostFactor))
      // 随机传说级符文石
      const runeStone = generateDemonRuneStone(
        compLevel,
        allSkills,
        seededRandom
      )
      const role = freeAllocIndices.has(i)
        ? 'balanced'
        : i < 10
          ? 'frontTank'
          : i < 15
            ? 'balanced'
            : 'backDPS'
      demons.push(
        createDemon(
          compLevel,
          ELEMENTS,
          allBuffTypes,
          allPreferences,
          runeStone,
          allSkills,
          seededRandom,
          role
        )
      )
    }
  }

  return demons
}

/**
 * 创建单个恶魔
 */
function createDemon(
  comprehensiveLevel,
  elements,
  allBuffTypes,
  allPreferences,
  runeStone,
  allSkills,
  rng,
  role = 'balanced'
) {
  const element = elements[Math.floor(rng() * elements.length)]
  const passiveBuff = allBuffTypes[Math.floor(rng() * allBuffTypes.length)]
  const preference = allPreferences[Math.floor(rng() * allPreferences.length)]

  // 分配属性等级（属性之和应为 comprehensiveLevel + 3，与玩家冒险家保持一致）
  let statLevels
  if (role === 'frontTank') {
    statLevels = distributeStatLevelsFrontRow(comprehensiveLevel + 3, rng)
  } else if (role === 'backDPS') {
    statLevels = distributeStatLevelsBackRow(comprehensiveLevel + 3, rng)
  } else {
    statLevels = distributeStatLevels(comprehensiveLevel + 3, rng)
  }

  return {
    _id: `demon_${Math.floor(rng() * 2176782336).toString(36)}`,
    name: generateRandomDemonName(),
    elements: element,
    passiveBuffType: passiveBuff.value,
    attackPreference: preference.value,
    defaultAvatarId: getRandomDemonAvatarId(rng),
    attackLevel: statLevels.attack,
    defenseLevel: statLevels.defense,
    speedLevel: statLevels.speed,
    SANLevel: statLevels.san,
    comprehensiveLevel,
    runeStone: runeStone,
    isDemon: true
  }
}

/**
 * 将综合等级分配为4种属性等级
 * 确保每种属性至少为1
 */
function distributeStatLevels(totalLevel, rng) {
  // 最少4（每项1），分配剩余
  const remaining = Math.max(totalLevel - 4, 0)
  const parts = [0, 0, 0, 0]

  for (let i = 0; i < remaining; i++) {
    parts[Math.floor(rng() * 4)]++
  }

  return {
    attack: parts[0] + 1,
    defense: parts[1] + 1,
    speed: parts[2] + 1,
    san: parts[3] + 1
  }
}

/**
 * 前排属性分配（极端偏向防御和SAN）
 * 防御/SAN各占45%，攻击/速度各占5%
 */
function distributeStatLevelsFrontRow(totalLevel, rng) {
  const remaining = Math.max(totalLevel - 4, 0)
  const parts = [0, 0, 0, 0] // [attack, defense, speed, san]
  for (let i = 0; i < remaining; i++) {
    const r = rng()
    if (r < 0.05)
      parts[0]++ // 5% 攻击
    else if (r < 0.5)
      parts[1]++ // 45% 防御
    else if (r < 0.55)
      parts[2]++ // 5% 速度
    else parts[3]++ // 45% SAN
  }
  return {
    attack: parts[0] + 1,
    defense: parts[1] + 1,
    speed: parts[2] + 1,
    san: parts[3] + 1
  }
}

/**
 * 后排属性分配（极端偏向攻击和速度）
 * 攻击/速度各占45%，防御/SAN各占5%
 */
function distributeStatLevelsBackRow(totalLevel, rng) {
  const remaining = Math.max(totalLevel - 4, 0)
  const parts = [0, 0, 0, 0] // [attack, defense, speed, san]
  for (let i = 0; i < remaining; i++) {
    const r = rng()
    if (r < 0.45)
      parts[0]++ // 45% 攻击
    else if (r < 0.5)
      parts[1]++ // 5% 防御
    else if (r < 0.95)
      parts[2]++ // 45% 速度
    else parts[3]++ // 5% SAN
  }
  return {
    attack: parts[0] + 1,
    defense: parts[1] + 1,
    speed: parts[2] + 1,
    san: parts[3] + 1
  }
}

/**
 * 将总等级分配给指定数量的恶魔
 */
function distributeLevels(totalLevel, count, rng) {
  const levels = new Array(count).fill(1)
  let remaining = Math.max(totalLevel - count, 0)

  while (remaining > 0) {
    const idx = Math.floor(rng() * count)
    levels[idx]++
    remaining--
  }

  return levels
}

/**
 * 为恶魔生成传说级符文石数据
 */
function generateDemonRuneStone(level, allSkills, rng) {
  // 传说级: 3主动技能 + 6被动增益 (等级21-30)
  const shuffledSkills = [...allSkills].sort(() => rng() - 0.5)
  const activeSkills = shuffledSkills
    .slice(0, 3)
    .map(s => ({ skillId: s.value }))

  const buffTypes = ['attack', 'defense', 'speed', 'san']
  const passiveBuffs = []
  for (let i = 0; i < 6; i++) {
    passiveBuffs.push({
      buffType: buffTypes[Math.floor(rng() * 4)],
      buffLevel: Math.floor(rng() * 10) + 21
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
 * 将恶魔列表排布到5x5棋盘
 * 按角色定位排序：前排优先防御/SAN型，后排优先攻击/速度型
 */
function placeDemonsOnGrid(demons) {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(null))

  // 为每个恶魔计算前排/后排倾向分数
  // 前排分 = (defenseLevel + SANLevel) / 综合等级
  // 后排分 = (attackLevel + speedLevel) / 综合等级
  const scored = demons.map(d => {
    const total =
      (d.attackLevel || 1) +
      (d.defenseLevel || 1) +
      (d.speedLevel || 1) +
      (d.SANLevel || 1)
    const frontScore = ((d.defenseLevel || 1) + (d.SANLevel || 1)) / total
    const backScore = ((d.attackLevel || 1) + (d.speedLevel || 1)) / total
    return { demon: d, frontScore, backScore }
  })

  // 按前排倾向排序（高→低），前排倾向高的放前排
  scored.sort((a, b) => b.frontScore - a.frontScore)

  let idx = 0
  for (let row = 0; row < 5 && idx < scored.length; row++) {
    for (let col = 0; col < 5 && idx < scored.length; col++) {
      grid[row][col] = scored[idx].demon
      idx++
    }
  }
  return grid
}

/**
 * 从战斗日志中找出击杀数最高的攻击方冒险家
 * @param {Object} battleResult - 战斗引擎返回的结果
 * @param {Array<Array<object|null>>} playerGrid - 玩家阵容网格
 * @returns {Array<{name: string, kills: number, adventurerId: string}>}
 */
function findTopKillers(battleResult, playerGrid) {
  const killCount = new Map() // adventurerId -> count
  const nameMap = new Map() // adventurerId -> name
  const avatarMap = new Map() // adventurerId -> avatar info

  // 收集玩家冒险家信息
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

  // 统计击杀数（当攻击后目标SAN值为0时记录击杀）
  if (battleResult.log) {
    for (const entry of battleResult.log) {
      if (entry.type === 'attack' && entry.defenderRemainSan === 0) {
        const attackerId = entry.attacker
        if (nameMap.has(attackerId)) {
          killCount.set(attackerId, (killCount.get(attackerId) || 0) + 1)
        }
      }
      // 符文石技能也可能造成击杀
      if (entry.type === 'runeStoneSkill' && entry.effects) {
        for (const effect of entry.effects) {
          if (effect.targetRemainSan === 0 && nameMap.has(entry.caster)) {
            killCount.set(entry.caster, (killCount.get(entry.caster) || 0) + 1)
          }
        }
      }
    }
  }

  // 排序，取前3名
  const sorted = [...killCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // 找出最高击杀数
  if (sorted.length === 0) return []
  const maxKills = sorted[0][1]

  // 返回击杀数相同的最高击杀者们
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
 * 挑战地牢军团
 */
export async function challengeLegion(accountId, formationSlot) {
  return await executeInLock(`legion:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const currentLevel = playerInfo.dungeonsLevel

    // 对战冷却检查
    if (playerInfo.lastBattleAt) {
      const elapsed = Date.now() - new Date(playerInfo.lastBattleAt).getTime()
      const cooldownLimit = BATTLE_COOLDOWN_SECONDS * 1000
      if (elapsed < cooldownLimit) {
        const remainSec = Math.ceil((cooldownLimit - elapsed) / 1000)
        const err = new Error(`对战冷却中，请等待 ${remainSec} 秒`)
        err.statusCode = 429
        err.expose = true
        throw err
      }
    }

    // 更新对战时间
    playerInfo.lastBattleAt = new Date()

    // 获取玩家阵容
    const formation = await GameFormation.findOne({
      account: accountId,
      slot: formationSlot
    })
    if (!formation) {
      const err = new Error('请先设置战斗阵容')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 加载阵容中的冒险家数据
    const adventurerIds = formation.grid.flat().filter(id => id !== null)
    if (adventurerIds.length === 0) {
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

    const adventurerMap = new Map()
    for (const adv of adventurers) {
      adventurerMap.set(adv._id.toString(), adv)
    }

    // 构建玩家棋盘
    const playerGrid = formation.grid.map(row =>
      row.map(id => (id ? adventurerMap.get(id.toString()) || null : null))
    )

    // 生成军团恶魔（使用种子确保与预览一致）
    const seed = generateSeed(accountId, currentLevel)
    const seededRandom = createSeededRandom(seed)
    const demons = generateLegionDemons(currentLevel, seededRandom)
    const demonGrid = placeDemonsOnGrid(demons)

    // 执行战斗
    const allSkillsDB = runeStoneActiveSkillDataBase()
    const battleResult = executeBattle(playerGrid, demonGrid, allSkillsDB)

    let result = {
      battleResult,
      dungeonLevel: currentLevel,
      upgraded: false,
      droppedRuneStone: null
    }

    // 胜利处理：必须全歼敌方军团才算通关，HP 比例胜利不算
    const allDefendersDead = !battleResult.defenderUnits.some(u => u.alive)
    if (battleResult.winner === 'attacker' && allDefendersDead) {
      // 升级地牢
      playerInfo.dungeonsLevel += 1

      // 必掉传说级符文石（背包满时丢弃并记录）
      const runeStoneCount = await runeStoneService.getRuneStoneCount(accountId)
      let droppedRuneStone = null
      let discardedRuneStone = null
      if (runeStoneCount >= 500) {
        const gs = global.$globalConfig?.gameSettings || {}
        const rarityCoeff = {
          normal:
            gs.runeStoneDecomposeNormalBase ?? RUNE_STONE_DECOMPOSE_NORMAL_BASE,
          rare: gs.runeStoneDecomposeRareBase ?? RUNE_STONE_DECOMPOSE_RARE_BASE,
          legendary:
            gs.runeStoneDecomposeLegendaryBase ??
            RUNE_STONE_DECOMPOSE_LEGENDARY_BASE
        }
        const convertedFragments = rarityCoeff['legendary'] * currentLevel
        await GamePlayerInventory.findOneAndUpdate(
          { account: accountId },
          { $inc: { runeFragment: convertedFragments } },
          { upsert: true }
        )
        discardedRuneStone = {
          rarity: 'legendary',
          level: currentLevel,
          convertedFragments
        }
      } else {
        droppedRuneStone = await runeStoneService.generateRuneStone(
          accountId,
          'legendary',
          currentLevel
        )
      }

      result.upgraded = true
      result.droppedRuneStone = droppedRuneStone
      result.discardedRuneStone = discardedRuneStone
      result.newDungeonLevel = playerInfo.dungeonsLevel

      // 找出击杀数最高的冒险家
      const topKillers = findTopKillers(battleResult, playerGrid)

      // 记录玩家动态
      recordActivity({
        type: 'dungeon_victory',
        account: accountId,
        guildName: playerInfo.guildName,
        title: `🏰 「${playerInfo.guildName}」攻破了迷宫 Lv.${currentLevel} 的军团！`,
        extra: {
          dungeonLevel: currentLevel,
          topKillers
        }
      })
    }

    // 保存 playerInfo（lastBattleAt 以及可能的 dungeonsLevel 更新）
    await playerInfo.save()

    return result
  })
}

/**
 * 预览军团恶魔（不进行战斗）
 */
export async function previewLegion(accountId) {
  const playerInfo = await GamePlayerInfo.findOne({ account: accountId }).lean()
  if (!playerInfo) {
    const err = new Error('玩家信息不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const demons = generateLegionDemons(
    playerInfo.dungeonsLevel,
    createSeededRandom(generateSeed(accountId, playerInfo.dungeonsLevel))
  )
  return {
    dungeonLevel: playerInfo.dungeonsLevel,
    demons: demons.map(d => ({
      name: d.name,
      elements: d.elements,
      defaultAvatarId: d.defaultAvatarId,
      attackLevel: d.attackLevel,
      defenseLevel: d.defenseLevel,
      speedLevel: d.speedLevel,
      SANLevel: d.SANLevel,
      comprehensiveLevel: d.comprehensiveLevel,
      runeStone: d.runeStone || null
    }))
  }
}
