import GameArenaSeason from '../../models/gameArenaSeason.js'
import GameArenaRegistration from '../../models/gameArenaRegistration.js'
import GameArenaBattleLog from '../../models/gameArenaBattleLog.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import GameFormation from '../../models/gameFormation.js'
import {
  executeInLock,
  generateRandomAdventurerName,
  generateRandomAdventurerAvatarId
} from '../../utils/utils.js'
import { recordActivity } from './activityService.js'
import { getRandomNpcGuildIconId } from 'shared/utils/utils.js'
import { executeBattle } from './battleEngine.js'
import * as mailService from './mailService.js'

/**
 * 后4排（索引5-24）中使用自由均衡分配的角色数量
 * 数值越大，高段位NPC阵容的整体强度越低
 */
import {
  runeStoneActiveSkillDataBase,
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import { BATTLE_VERSION, NPC_FREE_ALLOC_COUNT } from 'shared/constants/index.js'

/**
 * 获取或创建活跃赛季（仅在赛季进行中时返回，用于战斗等操作）
 * 返回 null 表示当前不在可战斗的赛季期间（结算中/休赛期/赛季已过期）
 */
export async function getOrCreateActiveSeason() {
  let season = await GameArenaSeason.findOne({ status: 'active' }).lean()

  if (!season) {
    // 没有活跃赛季，检查是否有结算中的
    const settingSeason = await GameArenaSeason.findOne({
      status: 'settling'
    }).lean()
    if (settingSeason) return null // 正在结算中

    // 创建新赛季
    season = await createNewSeason()
  }

  // 检查时间边界
  const now = new Date()
  // 赛季还没开始（休赛期）
  if (now < new Date(season.startTime)) return null
  // 赛季已过期（等待结算）
  if (now >= new Date(season.endTime)) return null

  return season
}

/**
 * 创建新赛季
 */
async function createNewSeason() {
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const seasonDays = Math.max(gameSettings.seasonDays ?? 3, 3)
  const poolAmount = gameSettings.arenaPoolAmount ?? 100000
  const participationReward = gameSettings.arenaParticipationReward ?? 500
  const battleGold = gameSettings.arenaBattleGold ?? 50

  // 赛季开始时间为下一个0点，结束时间为seasonDays天后的0点
  const now = new Date()
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  )
  const startTime = tomorrow
  const endTime = new Date(
    startTime.getTime() + seasonDays * 24 * 60 * 60 * 1000
  )

  // 获取最新赛季编号
  const lastSeason = await GameArenaSeason.findOne()
    .sort({ seasonNumber: -1 })
    .lean()
  const seasonNumber = (lastSeason?.seasonNumber || 0) + 1

  const season = await GameArenaSeason.create({
    seasonNumber,
    startTime,
    endTime,
    status: 'active',
    poolAmount,
    participationReward,
    battleGold
  })

  return season.toJSON()
}

/**
 * 获取竞技场信息（包含休赛期和结算中状态展示）
 */
export async function getArenaInfo(accountId) {
  // 1. 检查是否有结算中的赛季
  const settingSeason = await GameArenaSeason.findOne({
    status: 'settling'
  }).lean()
  if (settingSeason) {
    return {
      season: formatSeasonInfo(settingSeason),
      registration: null,
      nextRecoverIn: 0,
      status: 'settling',
      message: '赛季结算中，请稍后再来'
    }
  }

  // 2. 获取或创建活跃赛季记录
  let season = await GameArenaSeason.findOne({ status: 'active' }).lean()
  if (!season) {
    // 没有活跃赛季，创建新赛季
    season = await createNewSeason()
  }

  const now = new Date()

  // 3. 赛季还没开始（休赛期）
  if (now < new Date(season.startTime)) {
    return {
      season: formatSeasonInfo(season),
      registration: null,
      nextRecoverIn: 0,
      status: 'offseason',
      // season.startTime 就是下一赛季开始时间（createNewSeason 创建时设置）
      nextSeasonStartTime: season.startTime,
      message: '休赛期，下一赛季即将开始'
    }
  }

  // 4. 赛季已过期（等待结算）
  if (now >= new Date(season.endTime)) {
    const registration = await GameArenaRegistration.findOne({
      account: accountId,
      season: season._id
    }).lean()
    // 结算后 createNewSeason 会把下一赛季 startTime 设为结算当天的次日 0 点
    // 这里估算：endTime（0点）当天 3 点结算，新赛季从次日 0 点开始
    const endTime = new Date(season.endTime)
    const estimatedNextStart = new Date(
      endTime.getFullYear(),
      endTime.getMonth(),
      endTime.getDate() + 1,
      0,
      0,
      0,
      0
    )
    return {
      season: formatSeasonInfo(season),
      registration: registration ? formatRegistrationInfo(registration) : null,
      nextRecoverIn: 0,
      status: 'offseason',
      nextSeasonStartTime: estimatedNextStart,
      message: '赛季已结束，等待结算'
    }
  }

  // 5. 赛季进行中
  const registration = await GameArenaRegistration.findOne({
    account: accountId,
    season: season._id
  }).lean()

  // 计算恢复的挑战次数
  let currentChallengeUses = registration?.challengeUses ?? 0
  let nextRecoverIn = 0
  if (registration) {
    const lastRecover = new Date(registration.lastChallengeRecoverAt).getTime()
    const now = Date.now()
    const hoursElapsed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
    if (hoursElapsed > 0) {
      currentChallengeUses = Math.min(currentChallengeUses + hoursElapsed, 24)
    }
    // 如果未满24次，计算下次恢复剩余秒数
    if (currentChallengeUses < 24) {
      const nextRecoverAt = lastRecover + (hoursElapsed + 1) * 60 * 60 * 1000
      nextRecoverIn = Math.max(0, Math.ceil((nextRecoverAt - now) / 1000))
    }
  }

  return {
    season: formatSeasonInfo(season),
    nextRecoverIn,
    status: 'active',
    registration: registration
      ? {
          _id: registration._id,
          points: registration.points,
          challengeUses: currentChallengeUses,
          totalBattleCount: registration.totalBattleCount,
          guildName: registration.guildName,
          lockedAdventurerCount: registration.lockedAdventurers?.length || 0,
          lockedAdventurers: registration.lockedAdventurers || []
        }
      : null
  }
}

/**
 * 格式化赛季信息（安全输出）
 */
function formatSeasonInfo(season) {
  return {
    _id: season._id,
    seasonNumber: season.seasonNumber,
    startTime: season.startTime,
    endTime: season.endTime,
    status: season.status,
    poolAmount: season.poolAmount,
    battleGold: season.battleGold,
    participationReward: season.participationReward
  }
}

/**
 * 格式化报名信息（安全输出）
 */
function formatRegistrationInfo(registration) {
  return {
    _id: registration._id,
    points: registration.points,
    challengeUses: registration.challengeUses ?? 0,
    totalBattleCount: registration.totalBattleCount,
    guildName: registration.guildName,
    lockedAdventurerCount: registration.lockedAdventurers?.length || 0,
    lockedAdventurers: registration.lockedAdventurers || []
  }
}

/**
 * 获取竞技场阵容详情（含冒险家详细信息）
 */
export async function getArenaFormation(accountId, options = {}) {
  const { silent = false } = options
  const season = await getOrCreateActiveSeason()
  if (!season) {
    if (silent) return null
    const err = new Error('当前不在赛季进行期间')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const registration = await GameArenaRegistration.findOne({
    account: accountId,
    season: season._id
  }).lean()
  if (!registration) {
    if (silent) return null
    const err = new Error('你还没有报名本赛季')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 获取阵容中所有冒险家的详细信息
  const adventurerIds = registration.formationGrid
    .flat()
    .filter(id => id !== null)
  const adventurers =
    adventurerIds.length > 0
      ? await GameAdventurer.find({ _id: { $in: adventurerIds } })
          .select(
            '_id name elements defaultAvatarId hasCustomAvatar customAvatarUpdatedAt comprehensiveLevel'
          )
          .lean()
      : []

  const advMap = new Map()
  for (const adv of adventurers) {
    advMap.set(adv._id.toString(), adv)
  }

  // 构建带详情的阵容网格
  const grid = registration.formationGrid.map(row =>
    row.map(id => {
      if (!id) return null
      const adv = advMap.get(id.toString())
      return adv || null
    })
  )

  return {
    grid,
    lockedAdventurers: registration.lockedAdventurers || []
  }
}

/**
 * 报名竞技场
 */
export async function registerArena(accountId, formationSlot) {
  return await executeInLock(`arena-register:${accountId}`, async () => {
    const season = await getOrCreateActiveSeason()
    if (!season) {
      const err = new Error('当前不在赛季进行期间，无法报名')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查是否已报名
    const existing = await GameArenaRegistration.findOne({
      account: accountId,
      season: season._id
    })
    if (existing) {
      const err = new Error('你已报名本赛季竞技场')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 获取阵容
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

    const adventurerIds = formation.grid.flat().filter(id => id !== null)
    if (adventurerIds.length === 0) {
      const err = new Error('阵容中没有冒险家')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 验证冒险家归属
    const adventurers = await GameAdventurer.find({
      _id: { $in: adventurerIds },
      account: accountId
    })
    if (adventurers.length !== adventurerIds.length) {
      const err = new Error('阵容中存在无效的冒险家')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 获取公会名
    const playerInfo = await GamePlayerInfo.findOne({
      account: accountId
    }).lean()
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const registration = await GameArenaRegistration.create({
      account: accountId,
      season: season._id,
      formationGrid: formation.grid,
      lockedAdventurers: adventurerIds,
      guildName: playerInfo.guildName,
      challengeUses: 24,
      lastChallengeRecoverAt: new Date()
    })

    const safeReg = registration.toJSON()
    delete safeReg.account
    delete safeReg.season
    return safeReg
  })
}

/**
 * 更新阵容位置（不能替换冒险家，只能更改位置）
 */
export async function updateFormationPosition(accountId, newGrid) {
  return await executeInLock(`arena-formation:${accountId}`, async () => {
    const season = await getOrCreateActiveSeason()
    if (!season) {
      const err = new Error('当前不在赛季进行期间')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const registration = await GameArenaRegistration.findOne({
      account: accountId,
      season: season._id
    })
    if (!registration) {
      const err = new Error('你还没有报名本赛季')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 验证阵容：已锁定的冒险家不能被移除，可以添加新冒险家
    const newIds = newGrid
      .flat()
      .filter(id => id !== null)
      .map(id => id.toString())
    const lockedIds = registration.lockedAdventurers.map(id => id.toString())

    // 所有已锁定的冒险家必须仍然在新阵容中（不能移除）
    for (const id of lockedIds) {
      if (!newIds.includes(id)) {
        const err = new Error(
          '不能移除已锁定的冒险家，只能调整位置或添加新冒险家'
        )
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    // 检查是否有新增的冒险家（在newIds中但不在lockedIds中）
    const addedIds = [...new Set(newIds.filter(id => !lockedIds.includes(id)))]
    if (addedIds.length > 0) {
      // 验证新增冒险家归属
      const newAdvs = await GameAdventurer.find({
        _id: { $in: addedIds },
        account: accountId
      })
      if (newAdvs.length !== addedIds.length) {
        const err = new Error('存在无效的冒险家')
        err.statusCode = 400
        err.expose = true
        throw err
      }
      // 将新冒险家添加到锁定列表
      registration.lockedAdventurers.push(...addedIds)
    }

    registration.formationGrid = newGrid
    await registration.save()

    return { success: true }
  })
}

/**
 * 获取对手列表（优先返回缓存，支持强制刷新）
 * @param {string} accountId
 * @param {boolean} forceRefresh - 是否强制刷新
 */
export async function getMatchList(accountId, forceRefresh = false) {
  const season = await getOrCreateActiveSeason()
  if (!season) {
    const err = new Error('当前不在赛季进行期间')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const myReg = await GameArenaRegistration.findOne({
    account: accountId,
    season: season._id
  })
  if (!myReg) {
    const err = new Error('你还没有报名本赛季')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 如果不强制刷新，且有缓存数据，直接返回缓存
  if (
    !forceRefresh &&
    myReg.cachedOpponents &&
    myReg.cachedOpponents.length > 0 &&
    myReg.lastMatchRefreshAt
  ) {
    return {
      myPoints: myReg.points,
      opponents: myReg.cachedOpponents,
      refreshedAt: myReg.lastMatchRefreshAt
    }
  }

  // 强制刷新时检查10秒冷却
  if (forceRefresh && myReg.lastMatchRefreshAt) {
    const elapsed = Date.now() - new Date(myReg.lastMatchRefreshAt).getTime()
    if (elapsed < 10000) {
      const err = new Error(
        `刷新冷却中，请${Math.ceil((10000 - elapsed) / 1000)}秒后再试`
      )
      err.statusCode = 429
      err.expose = true
      throw err
    }
  }

  const myPoints = myReg.points

  // 查找竞技点±500范围内的其他玩家
  const opponents = await GameArenaRegistration.find({
    season: season._id,
    account: { $ne: accountId },
    points: { $gte: myPoints - 500, $lte: myPoints + 500 }
  })
    .sort({ points: -1 })
    .limit(10)
    .select('account guildName points formationGrid')
    .lean()

  // 获取对手的 playerInfoId 和公会图标信息
  const opAccountIds = opponents.map(op => op.account)
  const GamePlayerInfoModel = (await import('../../models/gamePlayerInfos.js'))
    .default
  const opInfos = await GamePlayerInfoModel.find({
    account: { $in: opAccountIds }
  })
    .select('account hasCustomGuildIcon customGuildIconUpdatedAt')
    .lean()
  const opInfoMap = new Map()
  for (const info of opInfos) {
    opInfoMap.set(info.account.toString(), info)
  }

  // 批量获取对手阵容冒险家用于计算战斗力
  const allOpAdvIds = []
  for (const op of opponents) {
    if (op.formationGrid) {
      const advIds = op.formationGrid.flat().filter(id => id !== null)
      allOpAdvIds.push(...advIds)
    }
  }
  const opAdventurers =
    allOpAdvIds.length > 0
      ? await GameAdventurer.find({ _id: { $in: allOpAdvIds } })
          .populate('runeStone')
          .select('attackLevel defenseLevel speedLevel SANLevel runeStone')
          .lean()
      : []
  const opAdvMap = new Map()
  for (const adv of opAdventurers) {
    opAdvMap.set(adv._id.toString(), adv)
  }

  // 导入战斗力计算函数
  const { calculateCombatPower } = await import('shared/utils/gameDatabase.js')

  const result = opponents.map(op => {
    const opInfo = opInfoMap.get(op.account.toString())
    // 计算阵容综合战斗力
    let totalCombatPower = 0
    if (op.formationGrid) {
      for (const row of op.formationGrid) {
        for (const id of row) {
          if (id) {
            const adv = opAdvMap.get(id.toString())
            if (adv) {
              totalCombatPower += calculateCombatPower(
                adv,
                adv.runeStone || null
              )
            }
          }
        }
      }
    }
    return {
      _id: op._id,
      registrationId: op._id.toString(),
      playerInfoId: opInfo?._id?.toString() || null,
      accountId: op.account.toString(),
      guildName: op.guildName,
      points: op.points,
      isNpc: false,
      hasCustomGuildIcon: opInfo?.hasCustomGuildIcon || false,
      customGuildIconUpdatedAt: opInfo?.customGuildIconUpdatedAt || null,
      combatPower: totalCombatPower
    }
  })

  // 不足10名用NPC补足
  while (result.length < 10) {
    let npcPoints
    if (myPoints >= 2000) {
      // 竞技点>=2000时，检查是否前三名
      const higherCount = await GameArenaRegistration.countDocuments({
        season: season._id,
        points: { $gt: myPoints }
      })
      if (higherCount < 3) {
        // 前三名：NPC竞技点 = 玩家竞技点 - random(0, 500)
        npcPoints = myPoints - Math.floor(Math.random() * 501)
      } else {
        npcPoints = myPoints + Math.floor(Math.random() * 200) - 100
      }
    } else {
      npcPoints = myPoints + Math.floor(Math.random() * 200) - 100
    }
    // 计算NPC综合战斗力（生成临时阵容计算）
    const npcFormation = generateNPCFormation(null, myPoints)
    let npcCombatPower = 0
    for (const row of npcFormation.grid) {
      for (const cell of row) {
        if (cell) {
          npcCombatPower += calculateCombatPower(cell, cell.runeStone || null)
        }
      }
    }
    const npcId = `npc_${result.length}`
    result.push({
      _id: npcId,
      registrationId: npcId,
      playerInfoId: null,
      guildName: generateRandomAdventurerName() + '公会',
      points: Math.max(npcPoints, 0),
      isNpc: true,
      npcGuildIconId: getRandomNpcGuildIconId(),
      combatPower: npcCombatPower
    })
  }

  // 保存缓存到数据库
  const now = new Date()
  myReg.cachedOpponents = result
  myReg.lastMatchRefreshAt = now
  await myReg.save()

  return { myPoints, opponents: result, refreshedAt: now }
}

/**
 * 挑战对手
 * @param {string} accountId - 当前玩家accountId
 * @param {string} registrationId - 对手的报名记录 _id 或 npc_ 前缀的NPC id
 */
export async function challengeOpponent(accountId, registrationId) {
  return await executeInLock(`arena-battle:${accountId}`, async () => {
    const season = await getOrCreateActiveSeason()
    if (!season) {
      const err = new Error('当前不在赛季进行期间，无法对战')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const myReg = await GameArenaRegistration.findOne({
      account: accountId,
      season: season._id
    })
    if (!myReg) {
      const err = new Error('你还没有报名本赛季')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 计算恢复的挑战次数
    const lastRecover = new Date(myReg.lastChallengeRecoverAt).getTime()
    const now = Date.now()
    const hoursElapsed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
    if (hoursElapsed > 0) {
      myReg.challengeUses = Math.min(myReg.challengeUses + hoursElapsed, 24)
      myReg.lastChallengeRecoverAt = new Date(
        lastRecover + hoursElapsed * 60 * 60 * 1000
      )
    }

    if (myReg.challengeUses <= 0) {
      const err = new Error('挑战次数不足，每小时恢复1次')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 服务端判断isNPC：以npc_开头的为NPC
    const isNPC =
      typeof registrationId === 'string' && registrationId.startsWith('npc_')

    // 加载我的阵容
    const myAdventurerIds = myReg.formationGrid.flat().filter(id => id !== null)
    const myAdventurers = await GameAdventurer.find({
      _id: { $in: myAdventurerIds },
      account: accountId
    })
      .populate('runeStone')
      .lean()

    const myAdvMap = new Map()
    for (const adv of myAdventurers) {
      myAdvMap.set(adv._id.toString(), adv)
    }
    const myGrid = myReg.formationGrid.map(row =>
      row.map(id => (id ? myAdvMap.get(id.toString()) || null : null))
    )

    let opponentGrid
    let opponentGuildName
    let opponentReg = null
    let opponentPoints = 500

    if (isNPC) {
      // 生成NPC阵容
      const npcResult = generateNPCFormation(myGrid, myReg.points)
      opponentGrid = npcResult.grid
      opponentGuildName = generateRandomAdventurerName() + '公会'

      if (myReg.points >= 2000) {
        // 竞技点>=2000时检查排名
        const higherCount = await GameArenaRegistration.countDocuments({
          season: season._id,
          points: { $gt: myReg.points }
        })
        if (higherCount < 3) {
          // 前三名：NPC竞技点 = 玩家竞技点 - random(0, 500)
          opponentPoints = myReg.points - Math.floor(Math.random() * 501)
        } else {
          opponentPoints = myReg.points + Math.floor(Math.random() * 200) - 100
        }
      } else {
        opponentPoints = myReg.points + Math.floor(Math.random() * 200) - 100
      }
    } else {
      // 加载对手阵容
      opponentReg = await GameArenaRegistration.findOne({
        _id: registrationId,
        season: season._id
      })
      if (!opponentReg) {
        const err = new Error('对手不存在或未报名')
        err.statusCode = 404
        err.expose = true
        throw err
      }

      opponentPoints = opponentReg.points

      // 验证对手在±500竞技点范围内
      if (Math.abs(myReg.points - opponentPoints) > 500) {
        const err = new Error('对手不在你的匹配范围内')
        err.statusCode = 400
        err.expose = true
        throw err
      }

      opponentGuildName = opponentReg.guildName

      const opAdventurerIds = opponentReg.formationGrid
        .flat()
        .filter(id => id !== null)
      const opAdventurers = await GameAdventurer.find({
        _id: { $in: opAdventurerIds }
      })
        .populate('runeStone')
        .lean()

      const opAdvMap = new Map()
      for (const adv of opAdventurers) {
        opAdvMap.set(adv._id.toString(), adv)
      }
      opponentGrid = opponentReg.formationGrid.map(row =>
        row.map(id => (id ? opAdvMap.get(id.toString()) || null : null))
      )
    }

    // 执行战斗
    const allSkillsDB = runeStoneActiveSkillDataBase()
    const battleResult = executeBattle(myGrid, opponentGrid, allSkillsDB)

    // 计算竞技点变动
    let pointsChange = 0
    // 对方的竞技点如果比自己低 那么加成的竞技点应该是最小值
    let changeAmount = 25 // 基础/默认变动
    if (opponentPoints < myReg.points) {
      changeAmount = 10
    } else {
      const pointsDiff = Math.abs(myReg.points - opponentPoints)
      changeAmount = Math.min(Math.max(pointsDiff, 10), 100)
    }

    if (battleResult.winner === 'attacker') {
      pointsChange = changeAmount
    } else if (battleResult.winner === 'defender') {
      pointsChange = -changeAmount
    }
    // 平局为0

    // 更新我的竞技点
    myReg.points = Math.max(myReg.points + pointsChange, 0)
    myReg.challengeUses -= 1
    myReg.totalBattleCount += 1
    await myReg.save()

    // 更新对手竞技点（非NPC）
    if (opponentReg && !isNPC) {
      opponentReg.points = Math.max(opponentReg.points - pointsChange, 0)
      await opponentReg.save()
    }

    // 发放战斗金币
    const battleGold = season.battleGold || 50
    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: battleGold } }
    )

    // 记录战斗日志（含战斗快照）
    // 保存冒险家的静态战斗属性快照（头像和名字等需实时获取）
    // NPC冒险家的名字和头像也保存在快照中，因为NPC没有数据库记录
    const snapshotUnit = (adv, row, col) => {
      const isNpcUnit =
        typeof adv._id === 'string' && adv._id.startsWith('npc_')
      const snapshot = {
        adventurerId: adv._id?.toString() || null,
        row,
        col,
        elements: adv.elements,
        attackLevel: adv.attackLevel,
        defenseLevel: adv.defenseLevel,
        speedLevel: adv.speedLevel,
        SANLevel: adv.SANLevel,
        comprehensiveLevel: adv.comprehensiveLevel,
        attackPreference: adv.attackPreference,
        passiveBuffType: adv.passiveBuffType,
        isDemon: !!adv.isDemon,
        runeStone: adv.runeStone
          ? {
              rarity: adv.runeStone.rarity,
              level: adv.runeStone.level,
              activeSkills: adv.runeStone.activeSkills,
              passiveBuffs: adv.runeStone.passiveBuffs
            }
          : null
      }
      // NPC冒险家的名字和头像保存在快照中
      if (isNpcUnit) {
        snapshot.npcName = adv.name || '未知'
        snapshot.npcDefaultAvatarId = adv.defaultAvatarId || 1
      }
      return snapshot
    }

    const attackerSnapshot = []
    const defenderSnapshot = []
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (myGrid[r][c])
          attackerSnapshot.push(snapshotUnit(myGrid[r][c], r, c))
        if (opponentGrid[r][c])
          defenderSnapshot.push(snapshotUnit(opponentGrid[r][c], r, c))
      }
    }

    await GameArenaBattleLog.create({
      season: season._id,
      attacker: accountId,
      attackerGuildName: myReg.guildName,
      defender: isNPC ? null : opponentReg.account,
      defenderGuildName: opponentGuildName,
      isNPC,
      winner: battleResult.winner,
      pointsChange,
      rounds: battleResult.rounds,
      goldEarned: battleGold,
      battleVersion: BATTLE_VERSION,
      attackerUnits: attackerSnapshot,
      defenderUnits: defenderSnapshot
      // battleLog: battleResult.log  // 暂时注释，缓解数据库压力
    })

    // 记录竞技场胜利动态
    if (battleResult.winner === 'attacker') {
      const topKillers = findArenaTopKillers(battleResult, myGrid)
      recordActivity({
        type: 'arena_victory',
        account: accountId,
        guildName: myReg.guildName,
        title: `⚔️ 「${myReg.guildName}」在竞技场击败了「${opponentGuildName}」！`,
        extra: {
          opponentGuildName,
          pointsChange,
          topKillers
        }
      })
    }

    return {
      battleResult,
      pointsChange,
      newPoints: myReg.points,
      opponentGuildName,
      goldEarned: battleGold
    }
  })
}

/**
 * 生成NPC阵容
 * - 竞技点 < 2000: 基于玩家阵容生成相似规模和等级的对手
 * - 竞技点 >= 2000: 固定25人，全员传说符文石，30级起步，随竞技点增长
 * @param {Array<Array<object|null>>} playerGrid - 玩家的5x5阵容
 * @param {number} playerPoints - 玩家的竞技点，用于决定NPC生成策略
 */
function generateNPCFormation(playerGrid, playerPoints = 500) {
  const ELEMENTS = ['1', '2', '3', '4', '5', '6']
  const allBuffTypes = passiveBuffTypeDataBase()
  const allPreferences = attackPreferenceDataBase()

  // 竞技点 >= 2000 时使用全新的固定强度生成策略
  if (playerPoints >= 2000) {
    return generateHighTierNPCFormation(
      playerPoints,
      ELEMENTS,
      allBuffTypes,
      allPreferences
    )
  }

  const shouldHaveRuneStone = playerPoints >= 1500

  // 分析玩家阵容：统计冒险家数量和等级
  const playerUnits = []
  if (playerGrid) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const unit = playerGrid[r]?.[c]
        if (unit) {
          playerUnits.push({
            row: r,
            col: c,
            avgLevel: Math.round(
              ((unit.attackLevel || 1) +
                (unit.defenseLevel || 1) +
                (unit.speedLevel || 1) +
                (unit.SANLevel || 1)) /
                4
            )
          })
        }
      }
    }
  }

  // 如果玩家阵容为空或无法解析，使用默认值
  const demonCount =
    playerUnits.length > 0
      ? playerUnits.length
      : Math.floor(Math.random() * 15) + 5

  const demons = []
  for (let i = 0; i < demonCount; i++) {
    // 基于玩家对应位置的冒险家等级生成NPC等级（±1浮动）
    let baseLevel
    if (playerUnits[i]) {
      baseLevel = playerUnits[i].avgLevel
    } else {
      // 多出的NPC使用玩家平均等级
      const avgAll =
        playerUnits.length > 0
          ? Math.round(
              playerUnits.reduce((sum, u) => sum + u.avgLevel, 0) /
                playerUnits.length
            )
          : 1
      baseLevel = avgAll
    }
    // 等级随机浮动±1，最小为1
    const level = Math.max(1, baseLevel + Math.floor(Math.random() * 3) - 1)

    demons.push({
      _id: `npc_adv_${i}`,
      name: generateRandomAdventurerName(),
      elements: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
      passiveBuffType:
        allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)].value,
      attackPreference:
        allPreferences[Math.floor(Math.random() * allPreferences.length)].value,
      defaultAvatarId: generateRandomAdventurerAvatarId(),
      attackLevel: level,
      defenseLevel: level,
      speedLevel: level,
      SANLevel: level,
      comprehensiveLevel: level * 4 - 3,
      runeStone: shouldHaveRuneStone ? generateNPCRuneStone(level) : null,
      isDemon: false
    })
  }

  // 将NPC放置到与玩家相同的位置上（优先），多余的依次填入空位
  const grid = Array.from({ length: 5 }, () => Array(5).fill(null))
  let idx = 0
  // 先放到玩家有冒险家的位置
  for (const pu of playerUnits) {
    if (idx < demons.length) {
      grid[pu.row][pu.col] = demons[idx]
      idx++
    }
  }
  // 多余的NPC填入剩余空位
  for (let row = 0; row < 5 && idx < demons.length; row++) {
    for (let col = 0; col < 5 && idx < demons.length; col++) {
      if (!grid[row][col]) {
        grid[row][col] = demons[idx]
        idx++
      }
    }
  }

  return { grid, demons }
}

/**
 * 将综合等级分配到4个属性（攻击/防御/速度/SAN）
 * role: 'frontTank' - 极端偏向防御/SAN，'backDPS' - 极端偏向攻击/速度，'balanced' - 均衡分配
 * 属性之和 = comprehensiveLevel + 3，与玩家冒险家保持一致，每个属性最小为1。
 * @param {number} comprehensiveLevel
 * @param {string} role - 'frontTank' | 'backDPS' | 'balanced'
 * @returns {number[]} [attackLevel, defenseLevel, speedLevel, SANLevel]
 */
function distributeComprehensiveLevel(comprehensiveLevel, role = 'balanced') {
  const remaining = Math.max(comprehensiveLevel - 1, 0)
  const parts = [0, 0, 0, 0] // [attack, defense, speed, san]
  for (let i = 0; i < remaining; i++) {
    const r = Math.random()
    if (role === 'frontTank') {
      // 前排：defense 45%, san 45%, attack 5%, speed 5%
      if (r < 0.05) parts[0]++
      else if (r < 0.5) parts[1]++
      else if (r < 0.55) parts[2]++
      else parts[3]++
    } else if (role === 'backDPS') {
      // 后排：attack 45%, speed 45%, defense 5%, san 5%
      if (r < 0.45) parts[0]++
      else if (r < 0.5) parts[1]++
      else if (r < 0.95) parts[2]++
      else parts[3]++
    } else {
      // 均衡：各属性各占25%
      parts[Math.floor(r * 4)]++
    }
  }
  return [parts[0] + 1, parts[1] + 1, parts[2] + 1, parts[3] + 1]
}

/**
 * 生成高段位NPC阵容（竞技点 >= 2000）
 * 固定25人，全员传说级符文石。
 * 每名NPC冒险家的综合等级 = 30 + floor((竞技点 - 2000) × 0.05)，浮动 ±2。
 * 前10名（前2排）极端偏向防御/SAN，中间5名（第3排）均衡加点，后10名（后2排）极端偏向攻击/速度。
 */
function generateHighTierNPCFormation(
  playerPoints,
  elements,
  allBuffTypes,
  allPreferences
) {
  const baseComprehensiveLevel = 30 + Math.floor((playerPoints - 2000) * 0.05)
  const demons = []

  // 后4排（索引5-24）中随机 NPC_FREE_ALLOC_COUNT 名使用均衡自由分配
  const freeAllocIndices = new Set()
  while (freeAllocIndices.size < Math.min(NPC_FREE_ALLOC_COUNT, 20)) {
    freeAllocIndices.add(5 + Math.floor(Math.random() * 20))
  }

  for (let i = 0; i < 25; i++) {
    // 每个NPC综合等级在基础值上 ±2 浮动，最小为1
    const comprehensiveLevel = Math.max(
      1,
      baseComprehensiveLevel + Math.floor(Math.random() * 5) - 2
    )
    // 前10名（前2排）极端偏向防御/SAN，中间5名（第3排）均衡加点，后10名（后2排）极端偏向攻击/速度
    // freeAllocIndices 中的位置改用均衡自由分配
    const role = freeAllocIndices.has(i)
      ? 'balanced'
      : i < 10
        ? 'frontTank'
        : i < 15
          ? 'balanced'
          : 'backDPS'
    // 将综合等级按角色分配到4个属性
    const [attackLevel, defenseLevel, speedLevel, SANLevel] =
      distributeComprehensiveLevel(comprehensiveLevel, role)
    const runeStone = generateHighTierNPCRuneStone(comprehensiveLevel)

    demons.push({
      _id: `npc_adv_${i}`,
      name: generateRandomAdventurerName(),
      elements: elements[Math.floor(Math.random() * elements.length)],
      passiveBuffType:
        allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)].value,
      attackPreference:
        allPreferences[Math.floor(Math.random() * allPreferences.length)].value,
      defaultAvatarId: generateRandomAdventurerAvatarId(),
      attackLevel,
      defenseLevel,
      speedLevel,
      SANLevel,
      comprehensiveLevel,
      runeStone,
      isDemon: false
    })
  }

  // 将NPC按前排/后排倾向排布到5x5棋盘
  const grid = Array.from({ length: 5 }, () => Array(5).fill(null))
  let idx = 0
  for (let row = 0; row < 5 && idx < demons.length; row++) {
    for (let col = 0; col < 5 && idx < demons.length; col++) {
      grid[row][col] = demons[idx]
      idx++
    }
  }

  return { grid, demons }
}

/**
 * 生成高段位NPC传说级符文石（竞技点 >= 2000 专用）
 * 传说级：3主动技能 + 6被动增益（等级21-30）
 * @param {number} comprehensiveLevel - 冒险家综合等级，符文石等级与其一致
 */
function generateHighTierNPCRuneStone(comprehensiveLevel) {
  const allSkills = runeStoneActiveSkillDataBase()
  const BUFF_TYPES = ['attack', 'defense', 'speed', 'san']
  const runeLevel = Math.max(1, comprehensiveLevel)

  // 传说级固定配置
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5)
  const activeSkills = shuffled.slice(0, 3).map(s => ({ skillId: s.value }))
  const passiveBuffs = []
  for (let i = 0; i < 6; i++) {
    passiveBuffs.push({
      buffType: BUFF_TYPES[Math.floor(Math.random() * BUFF_TYPES.length)],
      buffLevel: Math.floor(Math.random() * 10) + 21
    })
  }
  return { rarity: 'legendary', level: runeLevel, activeSkills, passiveBuffs }
}

/**
 * 生成NPC符文石（用于1500+竞技点的NPC冒险家）
 * @param {number} adventurerLevel - 冒险家等级
 */
function generateNPCRuneStone(adventurerLevel) {
  const allSkills = runeStoneActiveSkillDataBase()
  const BUFF_TYPES = ['attack', 'defense', 'speed', 'san']
  // 等级 = 冒险家等级±浮动
  const runeLevel = Math.max(
    1,
    adventurerLevel + Math.floor(Math.random() * 3) - 1
  )
  // 随机稀有度
  const rarityRoll = Math.random()
  const rarity =
    rarityRoll < 0.05 ? 'legendary' : rarityRoll < 0.25 ? 'rare' : 'normal'
  // 随机1-2个主动技能
  const skillCount = Math.random() < 0.5 ? 1 : 2
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5)
  const activeSkills = shuffled
    .slice(0, skillCount)
    .map(s => ({ skillId: s.value }))
  // 随机1-3个被动增益
  const passiveCount = Math.floor(Math.random() * 3) + 1
  const passiveBuffs = []
  for (let i = 0; i < passiveCount; i++) {
    passiveBuffs.push({
      buffType: BUFF_TYPES[Math.floor(Math.random() * BUFF_TYPES.length)],
      buffLevel: Math.floor(Math.random() * Math.min(runeLevel, 30)) + 1
    })
  }
  return { rarity, level: runeLevel, activeSkills, passiveBuffs }
}

/**
 * 从竞技场战斗记录中找出击杀数最高的玩家冒险家
 */
function findArenaTopKillers(battleResult, playerGrid) {
  const killCount = new Map()
  const nameMap = new Map()
  const avatarMap = new Map()

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

  // 统计击杀数
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
 * 获取我的竞技场战斗记录（列表，不含大量战斗数据）
 */
export async function getMyBattleLogs(
  accountId,
  { page = 1, pageSize = 20 } = {}
) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  // 查询最近的赛季（包含活跃或刚结束等待结算的），以便休赛期也能查看记录
  const season = await GameArenaSeason.findOne({
    status: { $in: ['active', 'settling'] }
  })
    .sort({ seasonNumber: -1 })
    .lean()
  if (!season) return { list: [], total: 0 }

  const filter = {
    season: season._id,
    $or: [{ attacker: accountId }, { defender: accountId }]
  }
  const total = await GameArenaBattleLog.countDocuments(filter)
  const rawList = await GameArenaBattleLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('-attackerUnits -defenderUnits -battleLog')
    .lean()

  // 为前端计算便捷字段
  const list = rawList.map(log => {
    const isAttacker = log.attacker?.toString() === accountId
    const isWin =
      (isAttacker && log.winner === 'attacker') ||
      (!isAttacker && log.winner === 'defender')
    const isDraw = log.winner === 'draw'
    const opponentName = isAttacker
      ? log.defenderGuildName
      : log.attackerGuildName
    // 不向前端暴露isNPC字段和账号ObjectId
    const {
      isNPC: _isNPC,
      attacker: _attacker,
      defender: _defender,
      season: _season,
      ...logData
    } = log
    return {
      ...logData,
      isAttacker,
      isWin,
      isDraw,
      opponentName,
      pointsChange: isAttacker ? log.pointsChange : -log.pointsChange
    }
  })

  return { list, total, currentBattleVersion: BATTLE_VERSION }
}

/**
 * 获取竞技场战斗记录详情（含战斗快照和回放）
 */
export async function getBattleLogDetail(accountId, logId) {
  const log = await GameArenaBattleLog.findById(logId).lean()
  if (!log) {
    const err = new Error('战斗记录不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 只有参战方才能查看
  const isAttacker = log.attacker?.toString() === accountId
  const isDefender = log.defender?.toString() === accountId
  if (!isAttacker && !isDefender) {
    const err = new Error('无权查看此战斗记录')
    err.statusCode = 403
    err.expose = true
    throw err
  }

  // 版本检查
  if (log.battleVersion !== BATTLE_VERSION) {
    return {
      versionMismatch: true,
      message: '战斗系统版本已更新，无法查看此记录的详情',
      basicInfo: {
        winner: log.winner,
        rounds: log.rounds,
        pointsChange: isAttacker ? log.pointsChange : -log.pointsChange,
        goldEarned: log.goldEarned,
        attackerGuildName: log.attackerGuildName,
        defenderGuildName: log.defenderGuildName,
        createdAt: log.createdAt
      }
    }
  }

  // 实时获取冒险家的头像和名字（可自定义的内容）
  // NPC冒险家（adventurerId以npc_开头）使用快照中保存的名字和头像
  const allAdvIds = [...(log.attackerUnits || []), ...(log.defenderUnits || [])]
    .map(u => u.adventurerId)
    .filter(id => id && !id.startsWith('npc_') && !id.startsWith('demon_'))

  const adventurers =
    allAdvIds.length > 0
      ? await GameAdventurer.find({ _id: { $in: allAdvIds } })
          .select(
            '_id name defaultAvatarId hasCustomAvatar customAvatarUpdatedAt'
          )
          .lean()
      : []

  const advMap = new Map()
  for (const adv of adventurers) {
    advMap.set(adv._id.toString(), adv)
  }

  // 为每个快照单元附加实时头像和名字
  const enrichUnit = unit => {
    const isNpcUnit =
      unit.adventurerId &&
      (unit.adventurerId.startsWith('npc_') ||
        unit.adventurerId.startsWith('demon_'))
    if (isNpcUnit) {
      // NPC冒险家使用快照中保存的名字和头像
      return {
        ...unit,
        name: unit.npcName || '未知',
        defaultAvatarId: unit.npcDefaultAvatarId || 1,
        hasCustomAvatar: false,
        customAvatarUpdatedAt: null
      }
    }
    const realAdv = advMap.get(unit.adventurerId)
    return {
      ...unit,
      name: realAdv?.name || '未知',
      defaultAvatarId: realAdv?.defaultAvatarId || 1,
      hasCustomAvatar: realAdv?.hasCustomAvatar || false,
      customAvatarUpdatedAt: realAdv?.customAvatarUpdatedAt || null
    }
  }

  return {
    versionMismatch: false,
    _id: log._id,
    winner: log.winner,
    rounds: log.rounds,
    pointsChange: isAttacker ? log.pointsChange : -log.pointsChange,
    goldEarned: log.goldEarned,
    attackerGuildName: log.attackerGuildName,
    defenderGuildName: log.defenderGuildName,
    createdAt: log.createdAt,
    battleVersion: log.battleVersion,
    attackerUnits: (log.attackerUnits || []).map(enrichUnit),
    defenderUnits: (log.defenderUnits || []).map(enrichUnit)
    // battleLog: log.battleLog  // 暂时注释，缓解数据库压力
  }
}

/**
 * 获取排行榜
 */
export async function getLeaderboard({ page = 1, pageSize = 20 } = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  // 查询最近的赛季（包含活跃或刚结束等待结算的），以便休赛期也能查看排行榜
  const season = await GameArenaSeason.findOne({
    status: { $in: ['active', 'settling'] }
  })
    .sort({ seasonNumber: -1 })
    .lean()
  if (!season) return { list: [], total: 0, season: null }

  const filter = { season: season._id }
  const total = await GameArenaRegistration.countDocuments(filter)
  const list = await GameArenaRegistration.find(filter)
    .sort({ points: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('account guildName points totalBattleCount')
    .lean()

  // 获取公会图标信息用于排行榜展示（返回 playerInfoId 而非 accountId，防止泄露）
  const GamePlayerInfoModel = (await import('../../models/gamePlayerInfos.js'))
    .default
  const accountIds = list.map(item => item.account)
  const infos = await GamePlayerInfoModel.find({
    account: { $in: accountIds }
  })
    .select('account hasCustomGuildIcon customGuildIconUpdatedAt')
    .lean()
  const infoMap = new Map()
  for (const info of infos) {
    infoMap.set(info.account.toString(), info)
  }
  const safeList = list.map(item => {
    const accId = item.account.toString()
    const info = infoMap.get(accId)
    return {
      _id: item._id,
      accountId: accId,
      guildName: item.guildName,
      points: item.points,
      totalBattleCount: item.totalBattleCount,
      playerInfoId: info?._id?.toString() || null,
      hasCustomGuildIcon: info?.hasCustomGuildIcon || false,
      customGuildIconUpdatedAt: info?.customGuildIconUpdatedAt || null
    }
  })

  return {
    list: safeList,
    total,
    season: { seasonNumber: season.seasonNumber, endTime: season.endTime }
  }
}

/**
 * 赛季结算（由定时任务调用）
 */
export async function settleCurrentSeason() {
  return await executeInLock('arena-settle', async () => {
    const season = await GameArenaSeason.findOne({ status: 'active' })
    if (!season) return { message: '没有活跃赛季' }

    // 检查是否到结算时间
    const now = new Date()
    // 结算日凌晨3点
    const settleTime = new Date(season.endTime)
    settleTime.setHours(3, 0, 0, 0)

    if (now < settleTime) return { message: '未到结算时间' }

    // 标记为结算中
    season.status = 'settling'
    await season.save()

    // 获取排行
    const allRegistrations = await GameArenaRegistration.find({
      season: season._id
    })
      .sort({ points: -1 })
      .lean()

    if (allRegistrations.length === 0) {
      season.status = 'ended'
      await season.save()
      await createNewSeason()
      return { message: '赛季结束，无参与者' }
    }

    const poolAmount = season.poolAmount || 100000
    const participationReward = season.participationReward || 500

    // 排名奖励
    const rewards = [
      { rank: 'first', pct: 0.6 },
      { rank: 'second', pct: 0.3 },
      { rank: 'third', pct: 0.1 }
    ]

    const results = {}
    for (
      let i = 0;
      i < Math.min(rewards.length, allRegistrations.length);
      i++
    ) {
      const reg = allRegistrations[i]
      const reward = Math.floor(poolAmount * rewards[i].pct)
      results[rewards[i].rank] = {
        account: reg.account,
        guildName: reg.guildName,
        points: reg.points,
        reward
      }

      // 发放奖励邮件
      await mailService.sendMail(reg.account, {
        title: `🏆 赛季${season.seasonNumber} 第${i + 1}名奖励`,
        content: `恭喜你在赛季${season.seasonNumber}中获得第${i + 1}名！\n竞技点：${reg.points}\n奖励金币：${reward}`,
        type: 'arena',
        attachGold: reward
      })

      // 记录动态：竞技场前三名
      const rankLabels = ['🥇 冠军', '🥈 亚军', '🥉 季军']
      recordActivity({
        type: 'arena_top3',
        account: reg.account,
        guildName: reg.guildName,
        title: `「${reg.guildName}」获得赛季${season.seasonNumber} ${rankLabels[i]}`,
        content: `竞技点 ${reg.points}，获得 ${reward} 金币奖励！`,
        extra: {
          rank: i + 1,
          seasonNumber: season.seasonNumber,
          points: reg.points,
          reward
        }
      })
    }

    season.results = results

    // 参与奖：完成24次主动战斗的玩家（排除前3名，他们已获得排名奖励）
    const top3Accounts = new Set(
      allRegistrations
        .slice(0, Math.min(3, allRegistrations.length))
        .map(r => r.account.toString())
    )
    for (const reg of allRegistrations) {
      if (top3Accounts.has(reg.account.toString())) continue
      if (reg.totalBattleCount >= 24) {
        await mailService.sendMail(reg.account, {
          title: `🎖️ 赛季${season.seasonNumber} 参与奖`,
          content: `感谢你积极参与赛季${season.seasonNumber}的竞技！\n战斗次数：${reg.totalBattleCount}\n奖励金币：${participationReward}`,
          type: 'arena',
          attachGold: participationReward
        })
      }

      // 发送赛季结果邮件给所有参与者
      const rank =
        allRegistrations.findIndex(
          r => r.account.toString() === reg.account.toString()
        ) + 1
      await mailService.sendMail(reg.account, {
        title: `📊 赛季${season.seasonNumber} 结算通知`,
        content: `赛季${season.seasonNumber}已结束。\n你的最终排名：第${rank}名\n最终竞技点：${reg.points}\n战斗次数：${reg.totalBattleCount}`,
        type: 'arena'
      })
    }

    season.status = 'ended'
    await season.save()

    // 创建新赛季
    await createNewSeason()

    return { message: '赛季结算完成', results }
  })
}
