import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import GameFormation from '../../models/gameFormation.js'
import { executeInLock } from '../../utils/utils.js'
import {
  generateRandomAdventurerName,
  generateRandomAdventurerAvatarId
} from '../../utils/utils.js'
import { executeBattle } from './battleEngine.js'
import * as runeStoneService from './runeStoneService.js'
import {
  runeStoneActiveSkillDataBase,
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'

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
 * 前25级：地牢等级数量的等级1恶魔
 * 后25级：25名恶魔，综合等级 = 25 + (地牢等级 × 10)，全员持有传说级符文石
 */
function generateLegionDemons(dungeonLevel, seededRandom) {
  const ELEMENTS = ['1', '2', '3', '4', '5', '6']
  const allBuffTypes = passiveBuffTypeDataBase()
  const allPreferences = attackPreferenceDataBase()
  const allSkills = runeStoneActiveSkillDataBase()
  // 恶魔头像 1-3（demon目录下有3个）
  const DEMON_AVATAR_COUNT = 3

  const demons = []

  if (dungeonLevel <= 25) {
    // 前25级：地牢等级数量的等级1恶魔
    const demonCount = Math.min(dungeonLevel, 25)
    for (let i = 0; i < demonCount; i++) {
      demons.push(
        createDemon(
          1,
          ELEMENTS,
          allBuffTypes,
          allPreferences,
          DEMON_AVATAR_COUNT,
          null,
          allSkills,
          seededRandom
        )
      )
    }
  } else {
    // 后25级：25名恶魔
    const totalLevel = 25 + dungeonLevel * 10
    const levels = distributeLevels(totalLevel, 25, seededRandom)

    for (let i = 0; i < 25; i++) {
      const compLevel = levels[i]
      // 随机传说级符文石
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
          DEMON_AVATAR_COUNT,
          runeStone,
          allSkills,
          seededRandom
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
  avatarCount,
  runeStone,
  allSkills,
  rng
) {
  const element = elements[Math.floor(rng() * elements.length)]
  const passiveBuff = allBuffTypes[Math.floor(rng() * allBuffTypes.length)]
  const preference = allPreferences[Math.floor(rng() * allPreferences.length)]

  // 分配属性等级
  const statLevels = distributeStatLevels(comprehensiveLevel, rng)

  return {
    _id: `demon_${Math.floor(rng() * 2176782336).toString(36)}`,
    name: generateRandomAdventurerName(),
    elements: element,
    passiveBuffType: passiveBuff.value,
    attackPreference: preference.value,
    defaultAvatarId: Math.floor(rng() * avatarCount) + 1,
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
 */
function placeDemonsOnGrid(demons) {
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

    // 对战冷却检查（10秒）
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

    // 胜利处理
    if (battleResult.winner === 'attacker') {
      // 升级地牢
      playerInfo.dungeonsLevel += 1

      // 必掉传说级符文石
      const legendaryRuneStone = await runeStoneService.generateRuneStone(
        accountId,
        'legendary'
      )

      result.upgraded = true
      result.droppedRuneStone = legendaryRuneStone
      result.newDungeonLevel = playerInfo.dungeonsLevel
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
      hasRuneStone: !!d.runeStone
    }))
  }
}
