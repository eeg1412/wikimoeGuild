import GamePlayerBanLog from '../../models/gamePlayerBanLogs.js'
import GamePlayerAccount from '../../models/gamePlayerAccounts.js'

/**
 * 封禁玩家账号
 * - 若该邮箱已有封禁记录，则更新封禁到期时间
 * - 否则新建一条封禁记录
 * - 封禁后 tokenVersion + 1，强制下线该玩家
 * @param {string} email - 玩家邮箱
 * @param {Date|string} banExpires - 封禁到期时间（必须是未来时间）
 * @param {string} [reason] - 封禁原因（可选）
 */
export async function banPlayer(email, banExpires) {
  const expires = new Date(banExpires)
  if (isNaN(expires.getTime()) || expires <= new Date()) {
    const err = new Error('封禁到期时间必须是未来的有效时间')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 更新或新建封禁记录
  await GamePlayerBanLog.findOneAndUpdate(
    { email },
    {
      email,
      banExpires: expires,
      // 重置自动过期时间（封禁到期时间 + 7 天后自动删除记录）
      expires: new Date(expires.getTime() + 7 * 24 * 60 * 60 * 1000)
    },
    { upsert: true, returnDocument: 'after' }
  )

  // tokenVersion + 1，强制下线
  await GamePlayerAccount.findOneAndUpdate(
    { email },
    { $inc: { tokenVersion: 1 } }
  )
}

/**
 * 修改玩家密码（管理端操作）
 * 修改后 tokenVersion + 1 强制下线
 * @param {string} accountId - 玩家账号 ID
 * @param {string} newPassword - 新密码（明文，存储前会自动加密）
 */
export async function changePlayerPassword(accountId, newPassword) {
  const account = await GamePlayerAccount.findById(accountId)
  if (!account) {
    const err = new Error('玩家账号不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  account.password = newPassword
  account.tokenVersion = (account.tokenVersion || 0) + 1
  await account.save()
}

/**
 * 获取封禁记录列表
 */
export async function listBanLogs({ page = 1, pageSize = 20, email }) {
  page = Math.max(1, Number(page))
  pageSize = Math.min(100, Math.max(1, Number(pageSize)))

  const filter = {}
  if (email) filter.email = { $regex: email, $options: 'i' }

  const [total, list] = await Promise.all([
    GamePlayerBanLog.countDocuments(filter),
    GamePlayerBanLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
  ])

  return { list, total }
}

/**
 * 删除封禁记录（解除封禁）
 * @param {string} id - 封禁记录 _id
 */
export async function deleteBanLog(id) {
  const result = await GamePlayerBanLog.deleteOne({ _id: id })
  if (result.deletedCount === 0) {
    const err = new Error('封禁记录不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
}
