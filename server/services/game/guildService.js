import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import { executeInLock } from '../../utils/utils.js'
import { saveBase64Image } from '../../utils/imageUpload.js'
import {
  getMaxAdventurerCount,
  getMaxComprehensiveLevel,
  getGuildLevelUpFee,
  getRequiredMaxLevelAdventurerCount
} from 'shared/utils/guildLevelUtils.js'
import { recordActivity } from './activityService.js'

/**
 * 修改公会标志（消耗金币）
 */
export async function changeGuildLogo(accountId, logoBase64) {
  return await executeInLock(`guild-logo:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const logoPrice = gameSettings.guildCustomLogoPrice ?? 5000

    if (playerInfo.gold < logoPrice) {
      const err = new Error(`金币不足，需要 ${logoPrice} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 保存标志图片
    const fileName = `${accountId}.png`
    await saveBase64Image(logoBase64, 'custom-guild-icon', fileName)

    // 扣除金币
    playerInfo.gold -= logoPrice
    playerInfo.hasCustomGuildIcon = true
    playerInfo.customGuildIconUpdatedAt = new Date()
    await playerInfo.save()

    return { success: true, gold: playerInfo.gold }
  })
}

/**
 * 修改公会名字（消耗金币）
 */
export async function changeGuildName(accountId, newName) {
  return await executeInLock(`guild-name:${accountId}`, async () => {
    // 敏感词过滤
    if (global.$sensitiveFilter && global.$sensitiveFilter.contains(newName)) {
      const err = new Error('公会名包含违禁词')
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

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const namePrice = gameSettings.guildChangeNamePrice ?? 1000

    if (playerInfo.gold < namePrice) {
      const err = new Error(`金币不足，需要 ${namePrice} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查公会名唯一性
    const existing = await GamePlayerInfo.findOne({
      guildName: newName,
      _id: { $ne: playerInfo._id }
    })
    if (existing) {
      const err = new Error('该公会名已被使用')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    playerInfo.gold -= namePrice
    playerInfo.guildName = newName
    await playerInfo.save()

    return { success: true, gold: playerInfo.gold, guildName: newName }
  })
}

/**
 * 获取指定玩家的公会信息（公开信息）
 * 注意：禁止返回 account 字段，防止泄露 gamePlayerAccount 的 ObjectId
 * 禁止返回敏感信息如金币等
 * @param {string} playerInfoId - GamePlayerInfo 的 _id
 */
export async function getGuildInfo(playerInfoId) {
  const playerInfo = await GamePlayerInfo.findById(playerInfoId)
    .select(
      'account guildName guildLevel hasCustomGuildIcon customGuildIconUpdatedAt adventurerCount createdAt'
    )
    .lean()
  if (!playerInfo) {
    const err = new Error('玩家不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const adventurers = await GameAdventurer.find({ account: playerInfo.account })
    .select(
      'name elements defaultAvatarId hasCustomAvatar customAvatarUpdatedAt roleTag comprehensiveLevel'
    )
    .sort({ comprehensiveLevel: -1 })
    .limit(25)
    .lean()

  return {
    accountId: playerInfo.account.toString(),
    guildName: playerInfo.guildName,
    hasCustomGuildIcon: playerInfo.hasCustomGuildIcon,
    customGuildIconUpdatedAt: playerInfo.customGuildIconUpdatedAt,
    adventurerCount: playerInfo.adventurerCount ?? adventurers.length,
    guildLevel: playerInfo.guildLevel || 1,
    createdAt: playerInfo.createdAt,
    adventurers
  }
}

/**
 * 获取公会等级升级进度信息
 */
export async function getGuildLevelInfo(accountId) {
  const playerInfo = await GamePlayerInfo.findOne({ account: accountId }).lean()
  if (!playerInfo) {
    const err = new Error('玩家信息不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const guildLevel = playerInfo.guildLevel || 1
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const feeBase = gameSettings.guildLevelUpFeeBase ?? 1000

  // 升级费用
  const fee = getGuildLevelUpFee(guildLevel, feeBase)
  // 所需综合等级
  const requiredCompLevel = getMaxComprehensiveLevel(guildLevel)
  // 所需满级冒险家数量
  const requiredCount = getRequiredMaxLevelAdventurerCount(guildLevel)
  // 当前满级冒险家数量
  const qualifiedCount = await GameAdventurer.countDocuments({
    account: accountId,
    comprehensiveLevel: { $gte: requiredCompLevel }
  })

  return {
    guildLevel,
    maxGuildLevel: 200000,
    fee,
    gold: playerInfo.gold,
    requiredCompLevel,
    requiredCount,
    qualifiedCount,
    maxAdventurerCount: getMaxAdventurerCount(guildLevel),
    maxComprehensiveLevel: getMaxComprehensiveLevel(guildLevel),
    nextMaxAdventurerCount: getMaxAdventurerCount(guildLevel + 1),
    nextMaxComprehensiveLevel: getMaxComprehensiveLevel(guildLevel + 1)
  }
}

/**
 * 公会等级升级
 */
export async function upgradeGuildLevel(accountId) {
  return await executeInLock(`guild-level:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const guildLevel = playerInfo.guildLevel || 1

    // 检查是否达到最大等级
    if (guildLevel >= 200000) {
      const err = new Error('公会等级已达到最大值')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const feeBase = gameSettings.guildLevelUpFeeBase ?? 1000

    // 计算升级费用
    const fee = getGuildLevelUpFee(guildLevel, feeBase)

    // 检查金币
    if (playerInfo.gold < fee) {
      const err = new Error(`金币不足，需要 ${fee} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查满级冒险家数量
    const requiredCompLevel = getMaxComprehensiveLevel(guildLevel)
    const requiredCount = getRequiredMaxLevelAdventurerCount(guildLevel)
    const qualifiedCount = await GameAdventurer.countDocuments({
      account: accountId,
      comprehensiveLevel: { $gte: requiredCompLevel }
    })

    if (qualifiedCount < requiredCount) {
      const err = new Error(
        `需要 ${requiredCount} 名综合等级达到 ${requiredCompLevel} 的冒险家，当前只有 ${qualifiedCount} 名`
      )
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币并升级
    playerInfo.gold -= fee
    playerInfo.guildLevel = guildLevel + 1
    await playerInfo.save()

    // 记录玩家动态
    recordActivity({
      type: 'guild_upgrade',
      account: accountId,
      guildName: playerInfo.guildName,
      title: `🏰 「${playerInfo.guildName}」升级到 Lv.${guildLevel + 1}！`,
      content: `公会等级提升至 Lv.${guildLevel + 1}`
    })

    return {
      success: true,
      gold: playerInfo.gold,
      guildLevel: playerInfo.guildLevel,
      maxAdventurerCount: getMaxAdventurerCount(playerInfo.guildLevel),
      maxComprehensiveLevel: getMaxComprehensiveLevel(playerInfo.guildLevel)
    }
  })
}
