import GamePlayerLoginLog from '../../models/gamePlayerLoginLogs.js'

/**
 * 玩家登录日志列表（分页）
 */
export async function list({ page = 1, pageSize = 20, email, ip, success }) {
  page = Math.max(1, Number(page))
  pageSize = Math.min(100, Math.max(1, Number(pageSize)))

  const filter = {}
  if (email) filter.email = { $regex: email, $options: 'i' }
  if (ip) filter.ip = { $regex: ip, $options: 'i' }
  if (success !== undefined && success !== '') {
    filter.success = success === 'true' || success === true
  }

  const [total, list] = await Promise.all([
    GamePlayerLoginLog.countDocuments(filter),
    GamePlayerLoginLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
  ])

  return { list, total }
}

/**
 * 删除单条登录日志
 */
export async function deleteOne(id) {
  const result = await GamePlayerLoginLog.deleteOne({ _id: id })
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
  const result = await GamePlayerLoginLog.deleteMany(filter)
  return { deletedCount: result.deletedCount }
}
