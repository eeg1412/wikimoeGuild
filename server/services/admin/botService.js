import mongoose from 'mongoose'
import GameBotProfile from '../../models/gameBotProfile.js'
import GamePlayerAccount from '../../models/gamePlayerAccounts.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import GameFormation from '../../models/gameFormation.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import GameArenaRegistration from '../../models/gameArenaRegistration.js'
import GamePlayerMail from '../../models/gamePlayerMail.js'
import GameMarketListing from '../../models/gameMarketListing.js'
import GameRuneStoneListing from '../../models/gameRuneStoneListing.js'
import GameMine from '../../models/gameMine.js'
import GameMineRevenue from '../../models/gameMineRevenue.js'
import GamePlayerActivity from '../../models/gamePlayerActivity.js'
import GamePlayerLoginLog from '../../models/gamePlayerLoginLogs.js'
import GamePlayerRegisterLog from '../../models/gamePlayerRegisterLogs.js'
import GamePlayerBanLog from '../../models/gamePlayerBanLogs.js'
import {
  generateRandomAdventurerAvatarId,
  generateRandomAdventurerName,
  generateRandomGuildName,
  executeInLock,
  generateIconAsync
} from '../../utils/utils.js'
import { saveBase64Image } from '../../utils/imageUpload.js'
import {
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import crypto from 'crypto'

/**
 * 生成一个唯一的机器人邮箱（内部标识用，不会暴露给前端）
 */
function generateBotEmail() {
  const id = crypto.randomBytes(8).toString('hex')
  return `bot_${id}@system.internal`
}

async function validateBotGuildName(accountId, guildName) {
  if (global.$sensitiveFilter && global.$sensitiveFilter.contains(guildName)) {
    const err = new Error('公会名包含违禁词')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const existing = await GamePlayerInfo.findOne({
    guildName,
    account: { $ne: accountId }
  }).lean()
  if (existing) {
    const err = new Error('该公会名已被使用')
    err.statusCode = 400
    err.expose = true
    throw err
  }
}

/**
 * 获取机器人列表
 */
export async function list({
  page = 1,
  pageSize = 20,
  guildName,
  isActive
} = {}) {
  page = Math.max(1, Number(page))
  pageSize = Math.min(100, Math.max(1, Number(pageSize)))

  // 基础匹配条件
  const matchStage = []
  if (isActive === 'true' || isActive === 'false') {
    matchStage.push({ $match: { isActive: isActive === 'true' } })
  }

  const pipeline = [
    ...matchStage,
    {
      $lookup: {
        from: 'game_player_infos',
        localField: 'account',
        foreignField: 'account',
        as: 'playerInfo'
      }
    },
    { $unwind: { path: '$playerInfo', preserveNullAndEmptyArrays: true } },
    ...(guildName
      ? [
          {
            $match: {
              'playerInfo.guildName': { $regex: guildName, $options: 'i' }
            }
          }
        ]
      : []),
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        list: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 1,
              account: 1,
              isActive: 1,
              formationTendency: {
                $ifNull: ['$formationTendency', 'balanced']
              },
              behaviorWeights: 1,
              marketSettings: 1,
              activeTimeSettings: 1,
              lastTickAt: 1,
              lastActions: { $slice: ['$lastActions', -5] },
              totalActions: 1,
              note: 1,
              createdAt: 1,
              'playerInfo.account': 1,
              'playerInfo.guildName': 1,
              'playerInfo.gold': 1,
              'playerInfo.guildLevel': 1,
              'playerInfo.adventurerCount': 1,
              'playerInfo.dungeonsLevel': 1,
              'playerInfo.hasCustomGuildIcon': 1,
              'playerInfo.customGuildIconUpdatedAt': 1
            }
          }
        ],
        total: [{ $count: 'count' }]
      }
    }
  ]

  const [result] = await GameBotProfile.aggregate(pipeline)
  return {
    list: result?.list || [],
    total: result?.total?.[0]?.count || 0
  }
}

/**
 * 获取机器人详情
 */
export async function getDetail(botId) {
  const bot = await GameBotProfile.findById(botId).lean()
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const playerInfo = await GamePlayerInfo.findOne({
    account: bot.account
  }).lean()
  const inventory = await GamePlayerInventory.findOne({
    account: bot.account
  }).lean()
  const formations = await GameFormation.find({ account: bot.account })
    .sort({ slot: 1 })
    .lean()
  const adventurers = await GameAdventurer.find({ account: bot.account })
    .populate('runeStone')
    .sort({ comprehensiveLevel: -1 })
    .lean()

  return {
    bot,
    playerInfo,
    inventory,
    adventurers,
    formations
  }
}

/**
 * 创建机器人
 */
export async function create({
  isActive = true,
  formationTendency = 'balanced',
  guildName,
  initialGold = 0,
  initialCrystals = {},
  behaviorWeights,
  marketSettings,
  activeTimeSettings,
  iconBase64,
  note = ''
} = {}) {
  return await executeInLock('bot-create', async () => {
    // 生成唯一公会名
    let finalGuildName = guildName
    if (!finalGuildName) {
      for (let i = 0; i < 20; i++) {
        const candidate = generateRandomGuildName()
        const exists = await GamePlayerInfo.findOne({
          guildName: candidate
        }).lean()
        if (!exists) {
          finalGuildName = candidate
          break
        }
      }
      if (!finalGuildName) {
        const err = new Error('无法生成唯一公会名，请手动指定')
        err.statusCode = 400
        err.expose = true
        throw err
      }
    } else {
      // 检查公会名唯一性
      const exists = await GamePlayerInfo.findOne({
        guildName: finalGuildName
      }).lean()
      if (exists) {
        const err = new Error('该公会名已被使用')
        err.statusCode = 400
        err.expose = true
        throw err
      }
      // 敏感词检查
      if (
        global.$sensitiveFilter &&
        global.$sensitiveFilter.contains(finalGuildName)
      ) {
        const err = new Error('公会名包含违禁词')
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    // 创建账号（内部系统邮箱 + 随机密码）
    const botEmail = generateBotEmail()
    const botPassword = crypto.randomBytes(32).toString('hex')
    const account = await GamePlayerAccount.create({
      email: botEmail,
      password: botPassword,
      isGuest: false
    })

    // 创建玩家信息
    await GamePlayerInfo.create({
      account: account._id,
      guildName: finalGuildName,
      gold: initialGold
    })

    // 创建背包
    await GamePlayerInventory.create({
      account: account._id,
      attackCrystal: initialCrystals.attackCrystal || 0,
      defenseCrystal: initialCrystals.defenseCrystal || 0,
      speedCrystal: initialCrystals.speedCrystal || 0,
      sanCrystal: initialCrystals.sanCrystal || 0,
      runeFragment: initialCrystals.runeFragment || 0
    })

    // 创建初始冒险家
    const ELEMENTS = ['1', '2', '3', '4', '5', '6']
    const allBuffTypes = passiveBuffTypeDataBase()
    const allPreferences = attackPreferenceDataBase()
    await GameAdventurer.create({
      account: account._id,
      elements: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
      passiveBuffType:
        allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)].value,
      attackPreference:
        allPreferences[Math.floor(Math.random() * allPreferences.length)].value,
      defaultAvatarId: generateRandomAdventurerAvatarId(),
      name: generateRandomAdventurerName()
    })

    // 更新冒险家计数
    await GamePlayerInfo.updateOne(
      { account: account._id },
      { $inc: { adventurerCount: 1 } }
    )

    // 生成公会图标
    await generateIconAsync(String(account._id)).catch(() => {})

    // 如果提供了自定义公会图标，保存并标记
    if (iconBase64) {
      await saveBase64Image(
        iconBase64,
        'custom-guild-icon',
        `${account._id}.png`
      )
      await GamePlayerInfo.updateOne(
        { account: account._id },
        {
          $set: {
            hasCustomGuildIcon: true,
            customGuildIconUpdatedAt: new Date()
          }
        }
      )
    }

    // 根据阵容倾向预设行为权重，并允许创建时覆盖默认值
    const finalBehaviorWeights = {
      ...getTendencyWeights(formationTendency),
      ...(behaviorWeights || {})
    }

    const finalMarketSettings = {
      sellCrystals: {
        maxMarketAmount: marketSettings?.sellCrystals?.maxMarketAmount ?? 0
      },
      sellRuneStones: {
        enabled: marketSettings?.sellRuneStones?.enabled ?? false,
        maxAmount: marketSettings?.sellRuneStones?.maxAmount ?? 3,
        rarities: marketSettings?.sellRuneStones?.rarities ?? ['legendary']
      },
      buyCrystals: {
        enabled: marketSettings?.buyCrystals?.enabled ?? true,
        maxPriceRatio: marketSettings?.buyCrystals?.maxPriceRatio ?? 1.0
      }
    }

    const finalActiveTimeSettings = {
      enabled: activeTimeSettings?.enabled ?? true,
      startHour: activeTimeSettings?.startHour ?? 8,
      endHour: activeTimeSettings?.endHour ?? 23
    }

    // 创建机器人档案
    const bot = await GameBotProfile.create({
      account: account._id,
      isActive,
      formationTendency,
      behaviorWeights: finalBehaviorWeights,
      marketSettings: finalMarketSettings,
      activeTimeSettings: finalActiveTimeSettings,
      note
    })

    return bot
  })
}

/**
 * 根据阵容倾向获取默认行为权重
 * 注：招募冒险家、升级属性、卖水晶、公会升级已成为共通行动，不再需要对应的行为权重
 */
function getTendencyWeights(tendency) {
  switch (tendency) {
    case 'aggressive':
      return {
        switchDungeon: 50,
        dungeonBattle: 85,
        arenaBattle: 80,
        mineExplore: 60,
        runeStoneManage: 60,
        formationManage: 70,
        idle: 10
      }
    case 'balanced':
      return {
        switchDungeon: 40,
        dungeonBattle: 70,
        arenaBattle: 60,
        mineExplore: 50,
        runeStoneManage: 50,
        formationManage: 60,
        idle: 20
      }
    case 'defensive':
      return {
        switchDungeon: 30,
        dungeonBattle: 50,
        arenaBattle: 40,
        mineExplore: 60,
        runeStoneManage: 60,
        formationManage: 50,
        idle: 30
      }
    case 'assassin':
      return {
        switchDungeon: 45,
        dungeonBattle: 80,
        arenaBattle: 85,
        mineExplore: 55,
        runeStoneManage: 55,
        formationManage: 65,
        idle: 10
      }
    default:
      return {
        switchDungeon: 40,
        dungeonBattle: 70,
        arenaBattle: 60,
        mineExplore: 50,
        runeStoneManage: 50,
        formationManage: 60,
        idle: 20
      }
  }
}

/**
 * 更新机器人设置
 */
export async function update(botId, data) {
  return await executeInLock(`bot-update:${botId}`, async () => {
    const bot = await GameBotProfile.findById(botId)
    if (!bot) {
      const err = new Error('机器人不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (data.guildName !== undefined) {
      await validateBotGuildName(bot.account, data.guildName)
    }

    const playerInfoUpdates = {}
    if (data.iconBase64 !== undefined) {
      const fileName = `${bot.account}.png`
      await saveBase64Image(data.iconBase64, 'custom-guild-icon', fileName)
      playerInfoUpdates.hasCustomGuildIcon = true
      playerInfoUpdates.customGuildIconUpdatedAt = new Date()
    }

    if (data.isActive !== undefined) bot.isActive = data.isActive
    if (data.formationTendency) {
      bot.formationTendency = data.formationTendency
      // 如果没有同时传递 behaviorWeights，则根据新倾向重置权重
      if (!data.behaviorWeights) {
        bot.behaviorWeights = getTendencyWeights(data.formationTendency)
      }
    }
    if (data.behaviorWeights) {
      for (const [key, value] of Object.entries(data.behaviorWeights)) {
        if (bot.behaviorWeights[key] !== undefined) {
          bot.behaviorWeights[key] = value
        }
      }
    }
    if (data.marketSettings) {
      if (data.marketSettings.sellCrystals) {
        const sc = data.marketSettings.sellCrystals
        if (!bot.marketSettings) bot.marketSettings = {}
        if (!bot.marketSettings.sellCrystals)
          bot.marketSettings.sellCrystals = {}
        // 只保留 maxMarketAmount 设置
        if (sc.maxMarketAmount !== undefined)
          bot.marketSettings.sellCrystals.maxMarketAmount = sc.maxMarketAmount
      }
      if (data.marketSettings.sellRuneStones) {
        const sr = data.marketSettings.sellRuneStones
        if (!bot.marketSettings) bot.marketSettings = {}
        if (!bot.marketSettings.sellRuneStones)
          bot.marketSettings.sellRuneStones = {}
        if (sr.enabled !== undefined)
          bot.marketSettings.sellRuneStones.enabled = sr.enabled
        if (sr.maxAmount !== undefined)
          bot.marketSettings.sellRuneStones.maxAmount = Math.min(
            100,
            Math.max(1, Math.trunc(sr.maxAmount))
          )
        if (sr.rarities !== undefined)
          bot.marketSettings.sellRuneStones.rarities = sr.rarities
      }
      if (data.marketSettings.buyCrystals) {
        const bc = data.marketSettings.buyCrystals
        if (!bot.marketSettings) bot.marketSettings = {}
        if (!bot.marketSettings.buyCrystals) bot.marketSettings.buyCrystals = {}
        if (bc.enabled !== undefined)
          bot.marketSettings.buyCrystals.enabled = bc.enabled
        if (bc.maxPriceRatio !== undefined)
          bot.marketSettings.buyCrystals.maxPriceRatio = bc.maxPriceRatio
      }
      bot.markModified('marketSettings')
    }
    if (data.activeTimeSettings) {
      const ats = data.activeTimeSettings
      if (!bot.activeTimeSettings) bot.activeTimeSettings = {}
      if (ats.enabled !== undefined)
        bot.activeTimeSettings.enabled = ats.enabled
      if (ats.startHour !== undefined)
        bot.activeTimeSettings.startHour = ats.startHour
      if (ats.endHour !== undefined)
        bot.activeTimeSettings.endHour = ats.endHour
      bot.markModified('activeTimeSettings')
    }
    if (data.note !== undefined) bot.note = data.note

    await bot.save()

    if (data.guildName !== undefined) {
      playerInfoUpdates.guildName = data.guildName
    }

    if (Object.keys(playerInfoUpdates).length > 0) {
      await GamePlayerInfo.updateOne(
        { account: bot.account },
        playerInfoUpdates
      )
    }

    // 使用 $unset 清理旧的不再使用的字段
    await GameBotProfile.updateOne(
      { _id: bot._id },
      {
        $unset: {
          'marketSettings.sellCrystals.enabled': '',
          'marketSettings.sellCrystals.reserveAmount': '',
          'marketSettings.sellCrystals.maxAmount': '',
          'behaviorWeights.guildUpgrade': ''
        }
      }
    )

    return bot
  })
}

/**
 * 删除机器人（同时清理所有相关数据）
 */
export async function remove(botId) {
  const bot = await GameBotProfile.findById(botId)
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const accountId = bot.account

  // 先取消所有活跃的市场挂单
  await GameMarketListing.updateMany(
    { account: accountId, status: 'active' },
    { $set: { status: 'cancelled' } }
  )
  await GameRuneStoneListing.updateMany(
    { account: accountId, status: 'active' },
    { $set: { status: 'cancelled' } }
  )

  // 删除该机器人拥有的矿场
  await GameMine.deleteMany({ owner: accountId })

  // 删除所有关联数据
  await Promise.all([
    GameAdventurer.deleteMany({ account: accountId }),
    GameFormation.deleteMany({ account: accountId }),
    GameRuneStone.deleteMany({ account: accountId }),
    GamePlayerInventory.deleteOne({ account: accountId }),
    GamePlayerMail.deleteMany({ account: accountId }),
    GameArenaRegistration.deleteMany({ account: accountId }),
    GameMineRevenue.deleteMany({ account: accountId }),
    GamePlayerActivity.deleteMany({ account: accountId }),
    GamePlayerLoginLog.deleteMany({ account: accountId }),
    GamePlayerRegisterLog.deleteMany({ account: accountId }),
    GamePlayerBanLog.deleteMany({ account: accountId }),
    GamePlayerInfo.deleteOne({ account: accountId }),
    GamePlayerAccount.deleteOne({ _id: accountId }),
    GameBotProfile.deleteOne({ _id: botId })
  ])

  return { success: true }
}

/**
 * 修改机器人公会名
 */
export async function updateGuildName(botId, guildName) {
  const bot = await GameBotProfile.findById(botId).lean()
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  await validateBotGuildName(bot.account, guildName)

  await GamePlayerInfo.updateOne({ account: bot.account }, { guildName })

  return { success: true, guildName }
}

/**
 * 修改机器人公会图标
 */
export async function updateGuildIcon(botId, iconBase64) {
  const bot = await GameBotProfile.findById(botId).lean()
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const fileName = `${bot.account}.png`
  await saveBase64Image(iconBase64, 'custom-guild-icon', fileName)

  await GamePlayerInfo.updateOne(
    { account: bot.account },
    {
      hasCustomGuildIcon: true,
      customGuildIconUpdatedAt: new Date()
    }
  )

  return { success: true }
}

/**
 * 修改机器人冒险家名字（管理员操作，不消耗金币）
 */
export async function updateAdventurerName(botId, adventurerId, name) {
  const bot = await GameBotProfile.findById(botId).lean()
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 敏感词检查
  if (global.$sensitiveFilter && global.$sensitiveFilter.contains(name)) {
    const err = new Error('名字包含违禁词')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const adventurer = await GameAdventurer.findOne({
    _id: adventurerId,
    account: bot.account
  })
  if (!adventurer) {
    const err = new Error('冒险家不存在或不属于该机器人')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  adventurer.name = name
  await adventurer.save()

  return { success: true }
}

/**
 * 修改机器人冒险家头像（管理员操作，不消耗金币）
 */
export async function updateAdventurerAvatar(
  botId,
  adventurerId,
  avatarBase64
) {
  const bot = await GameBotProfile.findById(botId).lean()
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const adventurer = await GameAdventurer.findOne({
    _id: adventurerId,
    account: bot.account
  })
  if (!adventurer) {
    const err = new Error('冒险家不存在或不属于该机器人')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const fileName = `${adventurerId}.webp`
  await saveBase64Image(avatarBase64, 'custom-adventurer-avatar', fileName)

  adventurer.hasCustomAvatar = true
  adventurer.customAvatarUpdatedAt = new Date()
  await adventurer.save()

  return { success: true }
}

/**
 * 手动触发机器人行动（用于测试）
 */
export async function triggerBotAction(botId) {
  const bot = await GameBotProfile.findById(botId)
  if (!bot) {
    const err = new Error('机器人不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 异步执行，通过 per-bot 锁保证同一机器人的行动按队列顺序执行
  import('../../services/game/botBehaviorTree.js')
    .then(({ executeBotTick }) => {
      return executeInLock(`bot-tick:${botId}`, async () => {
        // 每次执行前重新获取最新的 bot 数据
        const freshBot = await GameBotProfile.findById(botId)
        if (freshBot) await executeBotTick(freshBot)
      })
    })
    .catch(err => {
      console.error(`[BotTrigger] 机器人 ${botId} 行动执行失败:`, err)
    })

  return { message: '行动已触发，请稍后查看详情日志' }
}

/**
 * 检查账号是否为机器人
 */
export async function isBotAccount(accountId) {
  const count = await GameBotProfile.countDocuments({ account: accountId })
  return count > 0
}
