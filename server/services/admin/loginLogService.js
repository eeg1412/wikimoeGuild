import AdminLoginLog from '../../models/adminLoginLogs.js'
import { getUserIp, IP2LocationUtils, deviceUtils } from '../../utils/utils.js'

/**
 * 检查 IP 登录频率限制
 * 1 小时内失败次数 >= 3 则封锁
 * @param {string} ip
 */
export async function checkIpRateLimit(ip) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const failCount = await AdminLoginLog.countDocuments({
    ip,
    success: false,
    createdAt: { $gte: oneHourAgo }
  })
  if (failCount >= 3) {
    const err = new Error('该 IP 在 1 小时内登录失败次数过多，请稍后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }
}

/**
 * 检查账号登录频率限制
 * 24 小时内尝试次数 >= 1000 则封锁
 * @param {string} username
 */
export async function checkUsernameRateLimit(username) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const attemptCount = await AdminLoginLog.countDocuments({
    username,
    createdAt: { $gte: oneDayAgo }
  })
  if (attemptCount >= 1000) {
    const err = new Error('该账号在 24 小时内登录尝试次数过多，请稍后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }
}

/**
 * 创建登录日志
 * @param {object} options
 * @param {string} options.username
 * @param {string} options.ip
 * @param {boolean} options.success
 * @param {string} options.message
 */
export async function createLoginLog({ username, ip, success, message }) {
  // username 最多 30 字符
  const safeUsername = username ? String(username).slice(0, 30) : ''
  const log = await AdminLoginLog.create({
    username: safeUsername,
    ip,
    success,
    message
  })
  return log
}

/**
 * 从 req 中提取并记录登录日志
 * @param {import('express').Request} req
 * @param {object} options
 * @param {string} options.username
 * @param {boolean} options.success
 * @param {string} options.message
 */
export async function recordLoginLog(req, { username, success, message }) {
  const ip = getUserIp(req)
  const log = await createLoginLog({ username, ip, success, message })
  // 异步解析设备信息
  deviceUtils(req, log._id, AdminLoginLog)
  // 异步解析 IP 和设备信息，不阻塞主流程
  IP2LocationUtils(ip, log._id, AdminLoginLog).catch(() => {})
  return log
}

/**
 * 登录历史列表（分页）
 * @param {object} query
 * @param {number} query.page
 * @param {number} query.pageSize
 * @param {string} [query.username]
 * @param {string} [query.ip]
 * @param {string} [query.success]
 */
export async function list({ page = 1, pageSize = 20, username, ip, success }) {
  const filter = {}
  if (username) {
    filter.username = { $regex: username, $options: 'i' }
  }
  if (ip) {
    filter.ip = { $regex: ip, $options: 'i' }
  }
  if (success !== undefined && success !== '') {
    filter.success = success === 'true' || success === true
  }

  const skip = (Number(page) - 1) * Number(pageSize)
  const [total, items] = await Promise.all([
    AdminLoginLog.countDocuments(filter),
    AdminLoginLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize))
  ])

  return { list: items, total, page: Number(page), pageSize: Number(pageSize) }
}
