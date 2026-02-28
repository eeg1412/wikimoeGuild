import GamePlayerAccount from '../../models/gamePlayerAccounts.js'
import * as mailService from '../game/mailService.js'

/**
 * 管理后台发送邮件
 * @param {Object} params
 * @param {string} params.title - 邮件标题
 * @param {string} params.content - 邮件内容
 * @param {string} params.sendTo - 发送对象 'all' | 'specific'
 * @param {string[]} params.playerIds - 指定玩家ID列表（sendTo='specific'时required）
 * @param {number} params.attachGold - 附带金币
 * @param {Object} params.attachItems - 附带物品 { attackCrystal, defenseCrystal, speedCrystal, sanCrystal, runeFragment }
 */
export async function sendAdminMail({
  title,
  content = '',
  sendTo,
  playerIds = [],
  attachGold = 0,
  attachItems = {}
}) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    const err = new Error('邮件标题不能为空')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (title.length > 100) {
    const err = new Error('邮件标题不能超过100个字符')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (content && content.length > 1000) {
    const err = new Error('邮件内容不能超过1000个字符')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  if (!['all', 'specific'].includes(sendTo)) {
    const err = new Error('发送对象类型无效')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 验证金币
  attachGold = parseInt(attachGold) || 0
  if (attachGold < 0 || attachGold > 99999999) {
    const err = new Error('附带金币数量无效')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 验证物品数量
  const validItemTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal',
    'runeFragment'
  ]
  const sanitizedItems = {}
  for (const key of validItemTypes) {
    const val = parseInt(attachItems[key]) || 0
    if (val < 0 || val > 99999) {
      const err = new Error(`${key} 数量无效`)
      err.statusCode = 400
      err.expose = true
      throw err
    }
    sanitizedItems[key] = val
  }

  let targetAccountIds = []

  if (sendTo === 'all') {
    // 获取所有玩家账号
    const accounts = await GamePlayerAccount.find().select('_id').lean()
    targetAccountIds = accounts.map(a => a._id)
  } else {
    // 指定玩家
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      const err = new Error('请指定至少一名玩家')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    if (playerIds.length > 1000) {
      const err = new Error('单次最多给1000名玩家发送邮件')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    // 验证玩家是否存在
    const accounts = await GamePlayerAccount.find({
      _id: { $in: playerIds }
    })
      .select('_id')
      .lean()
    targetAccountIds = accounts.map(a => a._id)
    if (targetAccountIds.length === 0) {
      const err = new Error('指定的玩家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }
  }

  // 批量发送邮件
  let successCount = 0
  for (const accountId of targetAccountIds) {
    try {
      await mailService.sendMail(accountId, {
        title: title.trim(),
        content: content || '',
        type: 'system',
        attachGold,
        attachItems: sanitizedItems
      })
      successCount++
    } catch {
      // 跳过失败的发送
    }
  }

  return {
    totalTargets: targetAccountIds.length,
    successCount
  }
}
