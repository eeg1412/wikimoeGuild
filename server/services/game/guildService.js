import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import { executeInLock } from '../../utils/utils.js'
import { saveBase64Image } from '../../utils/imageUpload.js'

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
