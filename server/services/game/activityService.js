import GamePlayerActivity from '../../models/gamePlayerActivity.js'

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

  return { list, total }
}
