import GamePlayerActivity from '../../models/gamePlayerActivity.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'

/**
 * 记录玩家动态（内部调用，不抛异常，失败仅 log）
 */
export async function recordActivity({
  type,
  account,
  guildName,
  title,
  content,
  extra
}) {
  try {
    await GamePlayerActivity.create({
      type,
      account: account || undefined,
      guildName: guildName || undefined,
      title,
      content: content || undefined,
      extra: extra || {}
    })
  } catch (err) {
    console.error('[Activity] 记录动态失败:', err.message)
  }
}

/**
 * 获取玩家动态列表（公开接口，无需登录）
 */
export async function getActivities({ page = 1, pageSize = 20 }) {
  page = Math.max(1, parseInt(page) || 1)
  pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20))

  const total = await GamePlayerActivity.countDocuments()
  const list = await GamePlayerActivity.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()

  // 填充公会头像信息
  const accountIds = list.filter(a => a.account).map(a => a.account)
  if (accountIds.length > 0) {
    const infos = await GamePlayerInfo.find({ account: { $in: accountIds } })
      .select('account hasCustomGuildIcon customGuildIconUpdatedAt')
      .lean()
    const infoMap = new Map()
    for (const info of infos) {
      infoMap.set(info.account.toString(), info)
    }
    for (const item of list) {
      const info = item.account ? infoMap.get(item.account.toString()) : null
      item.hasCustomGuildIcon = info?.hasCustomGuildIcon || false
      item.customGuildIconUpdatedAt = info?.customGuildIconUpdatedAt || null
      item.playerInfoId = info?._id?.toString() || null
      // 按公约仅返回 account ID（字符串），用于公会图标展示
      item.account = item.account ? item.account.toString() : undefined
    }
  }

  return { list, total }
}
