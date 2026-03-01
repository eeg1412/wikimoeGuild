import GamePlayerRegisterLog from '../../models/gamePlayerRegisterLogs.js'

/**
 * 玩家注册日志列表（分页）
 */
export async function list({
  page = 1,
  pageSize = 20,
  email,
  ip,
  success,
  isGuest
}) {
  page = Math.max(1, Number(page))
  pageSize = Math.min(100, Math.max(1, Number(pageSize)))

  const filter = {}
  if (email) filter.email = { $regex: email, $options: 'i' }
  if (ip) filter.ip = { $regex: ip, $options: 'i' }
  if (success !== undefined && success !== '') {
    filter.success = success === 'true' || success === true
  }
  if (isGuest !== undefined && isGuest !== '') {
    filter.isGuest = isGuest === 'true' || isGuest === true
  }

  const [total, list] = await Promise.all([
    GamePlayerRegisterLog.countDocuments(filter),
    GamePlayerRegisterLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
  ])

  return { list, total }
}

/**
 * 删除单条注册日志
 */
export async function deleteOne(id) {
  const result = await GamePlayerRegisterLog.deleteOne({ _id: id })
  if (result.deletedCount === 0) {
    const err = new Error('记录不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
}

/**
 * 按时间范围批量删除
 */
export async function batchDelete({ startTime, endTime }) {
  const filter = {}
  if (startTime || endTime) {
    filter.createdAt = {}
    if (startTime) filter.createdAt.$gte = new Date(startTime)
    if (endTime) filter.createdAt.$lte = new Date(endTime)
  }
  const result = await GamePlayerRegisterLog.deleteMany(filter)
  return { deletedCount: result.deletedCount }
}
