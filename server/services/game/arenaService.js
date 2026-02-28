import GameArenaSeason from '../../models/gameArenaSeason.js'
import GameArenaRegistration from '../../models/gameArenaRegistration.js'
import GameArenaBattleLog from '../../models/gameArenaBattleLog.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import GameFormation from '../../models/gameFormation.js'
import { executeInLock } from '../../utils/utils.js'
import { recordActivity } from './activityService.js'
import {
  generateRandomAdventurerName,
  generateRandomAdventurerAvatarId
} from '../../utils/utils.js'
import { executeBattle } from './battleEngine.js'
import * as mailService from './mailService.js'
import {
  runeStoneActiveSkillDataBase,
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import { BATTLE_VERSION } from 'shared/constants/index.js'

/**
 * 获取或创建活跃赛季
 */
export async function getOrCreateActiveSeason() {
  let season = await GameArenaSeason.findOne({ status: 'active' }).lean()
  if (season) return season

  // 没有活跃赛季，检查是否有结算中的
  const settingSeason = await GameArenaSeason.findOne({
    status: 'settling'
  }).lean()
  if (settingSeason) return null // 正在结算中

  // 创建新赛季
  return await createNewSeason()
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
 * 获取竞技场信息
 */
export async function getArenaInfo(accountId) {
  const season = await getOrCreateActiveSeason()
  if (!season) {
    return {
      season: null,
      registration: null,
      message: '赛季结算中，请稍后再来'
    }
  }

  const registration = await GameArenaRegistration.findOne({
    account: accountId,
    season: season._id
  }).lean()

  // 计算恢复的挑战次数
  let currentChallengeUses = registration?.challengeUses ?? 0
  if (registration) {
    const lastRecover = new Date(registration.lastChallengeRecoverAt).getTime()
    const now = Date.now()
    const hoursElapsed = Math.floor((now - lastRecover) / (60 * 60 * 1000))
    if (hoursElapsed > 0) {
      currentChallengeUses = Math.min(currentChallengeUses + hoursElapsed, 24)
    }
  }

  return {
    season: {
      _id: season._id,
      seasonNumber: season.seasonNumber,
      startTime: season.startTime,
      endTime: season.endTime,
      status: season.status,
      poolAmount: season.poolAmount,
      battleGold: season.battleGold,
      participationReward: season.participationReward
    },
    registration: registration
      ? {
          _id: registration._id,
          points: registration.points,
          challengeUses: currentChallengeUses,
          totalBattleCount: registration.totalBattleCount,
          guildName: registration.guildName,
          lockedAdventurerCount: registration.lockedAdventurers?.length || 0
        }
      : null
  }
}

/**
 * 报名竞技场
 */
export async function registerArena(accountId, formationSlot) {
  return await executeInLock(`arena-register:${accountId}`, async () => {
    const season = await getOrCreateActiveSeason()
    if (!season) {
      const err = new Error('赛季结算中，无法报名')
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

    return registration
  })
}

/**
 * 更新阵容位置（不能替换冒险家，只能更改位置）
 */
export async function updateFormationPosition(accountId, newGrid) {
  return await executeInLock(`arena-formation:${accountId}`, async () => {
    const season = await getOrCreateActiveSeason()
    if (!season) {
      const err = new Error('赛季结算中')
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

    // 验证新阵容中的冒险家ID与锁定列表一致
    const newIds = newGrid
      .flat()
      .filter(id => id !== null)
      .map(id => id.toString())
    const lockedIds = registration.lockedAdventurers.map(id => id.toString())

    // 新阵容中的冒险家必须都在锁定列表中
    for (const id of newIds) {
      if (!lockedIds.includes(id)) {
        const err = new Error('赛季期间不能替换冒险家，只能更改位置')
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    registration.formationGrid = newGrid
    await registration.save()

    return { success: true }
  })
}

/**
 * 获取匹配对手列表（竞技点±500内的10名玩家，不足用NPC补）
 */
export async function getMatchList(accountId) {
  const season = await getOrCreateActiveSeason()
  if (!season) {
    const err = new Error('赛季结算中')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const myReg = await GameArenaRegistration.findOne({
    account: accountId,
    season: season._id
  }).lean()
  if (!myReg) {
    const err = new Error('你还没有报名本赛季')
    err.statusCode = 400
    err.expose = true
    throw err
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
    .select('account guildName points')
    .lean()

  const result = opponents.map(op => ({
    _id: op._id,
    accountId: op.account,
    guildName: op.guildName,
    points: op.points,
    isNPC: false
  }))

  // 不足10名用NPC补足
  const ELEMENTS = ['1', '2', '3', '4', '5', '6']
  while (result.length < 10) {
    const npcPoints = myPoints + Math.floor(Math.random() * 200) - 100
    result.push({
      _id: `npc_${result.length}`,
      accountId: null,
      guildName: generateRandomAdventurerName() + '公会',
      points: Math.max(npcPoints, 0),
      isNPC: true
    })
  }

  return { myPoints, opponents: result }
}

/**
 * 挑战对手
 */
export async function challengeOpponent(accountId, opponentId) {
  return await executeInLock(`arena-battle:${accountId}`, async () => {
    const season = await getOrCreateActiveSeason()
    if (!season) {
      const err = new Error('赛季结算中')
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
      typeof opponentId === 'string' && opponentId.startsWith('npc_')

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
      const npcResult = generateNPCFormation()
      opponentGrid = npcResult.grid
      opponentGuildName = generateRandomAdventurerName() + '公会'
      opponentPoints = myReg.points + Math.floor(Math.random() * 200) - 100
    } else {
      // 加载对手阵容
      opponentReg = await GameArenaRegistration.findOne({
        account: opponentId,
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
    const pointsDiff = Math.abs(myReg.points - opponentPoints)
    const changeAmount = Math.min(Math.max(pointsDiff, 10), 100)

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
    const snapshotUnit = (adv, row, col) => ({
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
    })

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
      defender: isNPC ? null : opponentId,
      defenderGuildName: opponentGuildName,
      isNPC,
      winner: battleResult.winner,
      pointsChange,
      rounds: battleResult.rounds,
      goldEarned: battleGold,
      battleVersion: BATTLE_VERSION,
      attackerUnits: attackerSnapshot,
      defenderUnits: defenderSnapshot,
      battleLog: battleResult.log
    })

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
 */
function generateNPCFormation() {
  const ELEMENTS = ['1', '2', '3', '4', '5', '6']
  const allBuffTypes = passiveBuffTypeDataBase()
  const allPreferences = attackPreferenceDataBase()
  const demonCount = Math.floor(Math.random() * 15) + 5 // 5-19名
  const demons = []

  for (let i = 0; i < demonCount; i++) {
    const level = Math.floor(Math.random() * 5) + 1
    demons.push({
      _id: `npc_adv_${i}`,
      name: generateRandomAdventurerName(),
      elements: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
      passiveBuffType:
        allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)].value,
      attackPreference:
        allPreferences[Math.floor(Math.random() * allPreferences.length)].value,
      defaultAvatarId: Math.floor(Math.random() * 10) + 1,
      attackLevel: level,
      defenseLevel: level,
      speedLevel: level,
      SANLevel: level,
      comprehensiveLevel: level * 4,
      runeStone: null,
      isDemon: false
    })
  }

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
 * 获取我的竞技场战斗记录（列表，不含大量战斗数据）
 */
export async function getMyBattleLogs(
  accountId,
  { page = 1, pageSize = 20 } = {}
) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const season = await getOrCreateActiveSeason()
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
    return {
      ...log,
      isAttacker,
      isWin,
      isDraw,
      opponentName
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
        pointsChange: log.pointsChange,
        goldEarned: log.goldEarned,
        attackerGuildName: log.attackerGuildName,
        defenderGuildName: log.defenderGuildName,
        isNPC: log.isNPC,
        createdAt: log.createdAt
      }
    }
  }

  // 实时获取冒险家的头像和名字（可自定义的内容）
  const allAdvIds = [...(log.attackerUnits || []), ...(log.defenderUnits || [])]
    .map(u => u.adventurerId)
    .filter(id => id && !id.startsWith('npc_') && !id.startsWith('demon_'))

  const adventurers =
    allAdvIds.length > 0
      ? await GameAdventurer.find({ _id: { $in: allAdvIds } })
          .select('_id name defaultAvatarId hasCustomAvatar')
          .lean()
      : []

  const advMap = new Map()
  for (const adv of adventurers) {
    advMap.set(adv._id.toString(), adv)
  }

  // 为每个快照单元附加实时头像和名字
  const enrichUnit = unit => {
    const realAdv = advMap.get(unit.adventurerId)
    return {
      ...unit,
      name: realAdv?.name || unit.adventurerId || '未知',
      defaultAvatarId: realAdv?.defaultAvatarId || 1,
      hasCustomAvatar: realAdv?.hasCustomAvatar || false
    }
  }

  return {
    versionMismatch: false,
    _id: log._id,
    winner: log.winner,
    rounds: log.rounds,
    pointsChange: log.pointsChange,
    goldEarned: log.goldEarned,
    attackerGuildName: log.attackerGuildName,
    defenderGuildName: log.defenderGuildName,
    isNPC: log.isNPC,
    createdAt: log.createdAt,
    battleVersion: log.battleVersion,
    attackerUnits: (log.attackerUnits || []).map(enrichUnit),
    defenderUnits: (log.defenderUnits || []).map(enrichUnit),
    battleLog: log.battleLog
  }
}

/**
 * 获取排行榜
 */
export async function getLeaderboard({ page = 1, pageSize = 20 } = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const season = await getOrCreateActiveSeason()
  if (!season) return { list: [], total: 0, season: null }

  const filter = { season: season._id }
  const total = await GameArenaRegistration.countDocuments(filter)
  const list = await GameArenaRegistration.find(filter)
    .sort({ points: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('guildName points totalBattleCount')
    .lean()

  return {
    list,
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
