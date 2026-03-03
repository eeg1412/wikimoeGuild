import GamePlayerAccount from '../../models/gamePlayerAccounts.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerLoginLog from '../../models/gamePlayerLoginLogs.js'
import GamePlayerRegisterLog from '../../models/gamePlayerRegisterLogs.js'
import GameMailCode from '../../models/gameMailCodes.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GamePlayerBanLog from '../../models/gamePlayerBanLogs.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import {
  getUserIp,
  IP2LocationUtils,
  deviceUtils,
  deviceUAInfoUtils,
  executeInLock,
  generateIconAsync,
  generateRandomAdventurerAvatarId,
  generateRandomAdventurerName,
  generateRandomGuildName
} from '../../utils/utils.js'
import { sendVerifyCodeMail } from '../../utils/mailer.js'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../../config/jwtKeys.js'
import { JWT_CONFIG } from '../../config/jwt.js'
import { operationalLogger } from '../../utils/logger.js'
import { recordActivity } from './activityService.js'

/**
 * 签发玩家双 Token
 * @param {object} account  - 账号文档
 * @param {boolean} rememberMe - 是否保持登录
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function signPlayerTokens(account, rememberMe, { isGuest = false } = {}) {
  const payload = {
    id: account._id,
    email: account.email,
    tokenVersion: account.tokenVersion
  }
  const accessToken = jwt.sign(
    { ...payload, tokenType: 'access' },
    jwtKeys.playerSecret,
    { expiresIn: JWT_CONFIG.player.accessTokenExpiresIn }
  )

  let refreshExpiresIn
  if (isGuest) {
    refreshExpiresIn = JWT_CONFIG.player.guestRefreshTokenExpiresIn
  } else if (rememberMe) {
    refreshExpiresIn = JWT_CONFIG.player.rememberMeRefreshTokenExpiresIn
  } else {
    refreshExpiresIn = JWT_CONFIG.player.refreshTokenExpiresIn
  }

  const refreshToken = jwt.sign(
    { ...payload, tokenType: 'refresh', rememberMe: !!(rememberMe || isGuest) },
    jwtKeys.playerSecret,
    { expiresIn: refreshExpiresIn }
  )
  return { accessToken, refreshToken }
}

// ──────────────────────────────────────────────
// 验证码相关
// ──────────────────────────────────────────────

/**
 * 生成 6 位数字验证码
 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * 发送邮箱验证码
 * @param {import('express').Request} req
 * @param {string} email
 * @param {'register'|'resetPassword'} type
 */
export async function sendMailCode(req, email, type) {
  const ip = getUserIp(req)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

  // 找回密码：必须先确认该邮箱已注册，未注册则截断，不发送任何邮件
  if (type === 'resetPassword') {
    const exists = await GamePlayerAccount.exists({ email })
    if (!exists) {
      const err = new Error('该邮箱尚未注册，无法找回密码')
      err.statusCode = 400
      err.expose = true
      throw err
    }
  }

  // 注册 / 游客绑定：检查邮箱是否已被注册
  if (type === 'register' || type === 'guestBind') {
    const exists = await GamePlayerAccount.exists({ email })
    if (exists) {
      const err = new Error('该邮箱已被注册')
      err.statusCode = 400
      err.expose = true
      throw err
    }
  }

  // 同 IP 或同邮箱 1 分钟只能发 1 次（仅计算成功发送的记录）
  const recentByIp = await GameMailCode.findOne({
    ip,
    sent: true,
    createdAt: { $gte: oneMinuteAgo }
  })
  if (recentByIp) {
    const err = new Error('发送太频繁，请 1 分钟后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }

  const recentByEmail = await GameMailCode.findOne({
    email,
    sent: true,
    createdAt: { $gte: oneMinuteAgo }
  })
  if (recentByEmail) {
    const err = new Error('该邮箱发送太频繁，请 1 分钟后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }

  // 全局 24 小时邮件发送限制
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const dailyEmailLimit = gameSettings.dailyEmailLimit ?? 500
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const dailyEmailCount = await GameMailCode.countDocuments({
    sent: true,
    createdAt: { $gte: twentyFourHoursAgo }
  })
  if (dailyEmailCount >= dailyEmailLimit) {
    const err = new Error('系统邮件发送已达每日上限，请稍后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }

  const code = generateCode()
  const codeExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 分钟

  const record = await GameMailCode.create({
    email,
    code,
    ip,
    codeExpires,
    sent: false
  })

  // 异步记录 IP 和设备信息，不阻塞
  IP2LocationUtils(ip, record._id, GameMailCode).catch(() => {})
  deviceUtils(req, record._id, GameMailCode)

  // 发送邮件，成功后标记 sent
  // 邮件服务故障属于运营级错误，记录到 operational.log，向用户返回友好提示
  try {
    await sendVerifyCodeMail(email, code, type)
    record.sent = true
    await record.save()
  } catch (mailError) {
    console.error('[sendMailCode] 邮件发送失败:', mailError)
    operationalLogger.error(
      `邮件发送失败 to=${email} type=${type}: ${mailError.message}`,
      { stack: mailError.stack }
    )
    const err = new Error('邮件发送失败，请稍后重试或联系管理员')
    err.statusCode = 503
    err.expose = true
    throw err
  }
}

/**
 * 校验邮箱验证码（校验后标记为已使用）
 * @param {string} email
 * @param {string} code
 */
export async function verifyMailCode(email, code) {
  const record = await GameMailCode.findOne({
    email,
    code,
    used: false,
    codeExpires: { $gt: new Date() }
  })
  if (!record) {
    const err = new Error('验证码无效或已过期')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  record.used = true
  record.success = true
  await record.save()
}

// ──────────────────────────────────────────────
// 注册
// ──────────────────────────────────────────────

/**
 * 玩家注册
 * @param {import('express').Request} req
 * @param {object} body
 */
export async function register(req, { email, password, guildName, code }) {
  const ip = getUserIp(req)

  // 检测敏感词
  if (global.$sensitiveFilter && global.$sensitiveFilter.contains(guildName)) {
    const err = new Error('公会名包含违禁词')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 校验验证码
  await verifyMailCode(email, code)

  return await executeInLock(`register:${email}`, async () => {
    // 检测 isBot
    const ua = deviceUAInfoUtils(req)
    const type = ua?.browser?.type || null
    const botTypes = ['cli', 'crawler', 'fetcher', 'library']
    const isBot = type && botTypes.includes(type)
    if (isBot) {
      const err = new Error('检测到机器人行为，注册被拒绝')
      err.statusCode = 403
      err.expose = true
      throw err
    }

    // 1 小时内同 IP 注册次数限制（3 次）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const ipRegCount = await GamePlayerRegisterLog.countDocuments({
      ip,
      success: true,
      createdAt: { $gte: oneHourAgo }
    })
    if (ipRegCount >= 3) {
      const err = new Error('该 IP 1 小时内注册次数过多，请稍后再试')
      err.statusCode = 429
      err.expose = true
      throw err
    }

    // 邮箱唯一性
    const existingEmail = await GamePlayerAccount.findOne({ email })
    if (existingEmail) {
      const err = new Error('该邮箱已被注册')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 公会名唯一性
    const existingGuildName = await GamePlayerInfo.findOne({ guildName })
    if (existingGuildName) {
      const err = new Error('该公会名已被使用')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 创建账号
    const account = await GamePlayerAccount.create({ email, password })

    // 创建玩家信息
    const playerInfo = await GamePlayerInfo.create({
      account: account._id,
      guildName
    })

    // 创建初始冒险家
    const ELEMENTS = ['1', '2', '3', '4', '5', '6']
    const PASSIVE_BUFF_TYPES = ['1', '2', '3', '4', '5', '6']
    const randomElement = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]
    const randomPassiveBuff =
      PASSIVE_BUFF_TYPES[Math.floor(Math.random() * PASSIVE_BUFF_TYPES.length)]
    await GameAdventurer.create({
      account: account._id,
      elements: randomElement,
      passiveBuffType: randomPassiveBuff,
      defaultAvatarId: generateRandomAdventurerAvatarId(),
      name: generateRandomAdventurerName()
    })
    // 冒险家计数 +1
    await GamePlayerInfo.updateOne(
      { _id: playerInfo._id },
      { $inc: { adventurerCount: 1 } }
    )

    // 创建玩家背包
    await GamePlayerInventory.create({ account: account._id })

    // 记录注册日志
    const log = await GamePlayerRegisterLog.create({
      email,
      ip,
      success: true,
      message: '注册成功'
    })
    IP2LocationUtils(ip, log._id, GamePlayerRegisterLog).catch(() => {})
    deviceUtils(req, log._id, GamePlayerRegisterLog)

    // 生成公会图标（等待完成后再返回，避免前端请求到不存在的文件）
    await generateIconAsync(String(account._id)).catch(err => {
      console.error('生成公会图标失败', err)
    })

    // 记录动态：创建公会
    recordActivity({
      type: 'guild_created',
      account: account._id,
      guildName,
      title: `公会「${guildName}」已创建`,
      content: '欢迎新公会加入冒险！'
    })

    // 注册成功后自动签发 Token 实现免登录跳转
    const tokens = signPlayerTokens(account, false)
    const info = await GamePlayerInfo.findOne({ account: account._id })
      .select(
        'account guildName gold hasCustomGuildIcon customGuildIconUpdatedAt adventurerCount dungeonsLevel selectedDungeonsLevel dungeonsBackgroundId dungeonsCryRates lastDungeonSettleAt mapCanChangeUses lastMapRecoverAt miningCanUses lastMiningRecoverAt createdAt'
      )
      .lean()
    return { ...tokens, playerInfo: info }
  })
}

// ──────────────────────────────────────────────
// 登录
// ──────────────────────────────────────────────

/**
 * 玩家登录
 */
export async function login(req, { email, password, rememberMe = false }) {
  const ip = getUserIp(req)

  // 检查封禁状态
  const banLog = await GamePlayerBanLog.findOne({
    email,
    banExpires: { $gt: new Date() }
  })
  if (banLog) {
    const err = new Error(
      `该账号已被封禁，封禁到期时间：${banLog.banExpires.toLocaleString('zh-CN')}`
    )
    err.statusCode = 403
    err.expose = true
    throw err
  }

  const account = await GamePlayerAccount.findOne({ email })
  if (!account) {
    const err = new Error('邮箱或密码错误')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 1 小时内密码错误次数限制（3 次）
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const failCount = await GamePlayerLoginLog.countDocuments({
    email,
    success: false,
    createdAt: { $gte: oneHourAgo }
  })
  if (failCount >= 3) {
    const err = new Error('密码错误次数过多，请 1 小时后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }

  const passwordMatch = await account.comparePassword(password)
  if (!passwordMatch) {
    // 记录失败日志
    const log = await GamePlayerLoginLog.create({
      email,
      ip,
      success: false,
      message: '密码错误'
    })
    IP2LocationUtils(ip, log._id, GamePlayerLoginLog).catch(() => {})
    deviceUtils(req, log._id, GamePlayerLoginLog)

    const err = new Error('邮箱或密码错误')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 登录成功：24 小时内相同 IP 不重复记录
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existingSuccessLog = await GamePlayerLoginLog.findOne({
    email,
    ip,
    success: true,
    createdAt: { $gte: oneDayAgo }
  })
  if (!existingSuccessLog) {
    const log = await GamePlayerLoginLog.create({
      email,
      ip,
      success: true,
      message: '登录成功'
    })
    IP2LocationUtils(ip, log._id, GamePlayerLoginLog).catch(() => {})
    deviceUtils(req, log._id, GamePlayerLoginLog)
  }

  // 获取玩家信息
  const playerInfo = await GamePlayerInfo.findOne({ account: account._id })
    .select(
      'account guildName gold hasCustomGuildIcon customGuildIconUpdatedAt adventurerCount dungeonsLevel selectedDungeonsLevel dungeonsBackgroundId dungeonsCryRates lastDungeonSettleAt mapCanChangeUses lastMapRecoverAt miningCanUses lastMiningRecoverAt createdAt'
    )
    .lean()

  // 签发双 Token
  const { accessToken, refreshToken } = signPlayerTokens(account, rememberMe)

  return { accessToken, refreshToken, playerInfo }
}

/**
 * 刷新玩家 Token
 * 刷新时才校验 tokenVersion，不吁则吹销
 */
export async function refreshPlayerToken(refreshTokenStr) {
  let decoded
  try {
    decoded = jwt.verify(refreshTokenStr, jwtKeys.playerSecret)
  } catch {
    const err = new Error('刷新令牌无效或已过期')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  if (decoded.tokenType !== 'refresh') {
    const err = new Error('令牌类型错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const account = await GamePlayerAccount.findById(decoded.id)
  if (!account) {
    const err = new Error('用户不存在')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  if (account.tokenVersion !== decoded.tokenVersion) {
    const err = new Error('令牌已失效，请重新登录')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const rememberMe = decoded.rememberMe || false
  return signPlayerTokens(account, rememberMe)
}

// ──────────────────────────────────────────────
// 找回密码
// ──────────────────────────────────────────────

/**
 * 重置密码
 */
export async function resetPassword(req, { email, code, newPassword }) {
  // 校验验证码
  await verifyMailCode(email, code)

  const account = await GamePlayerAccount.findOne({ email })
  if (!account) {
    const err = new Error('该邮箱未注册')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  account.password = newPassword
  account.tokenVersion = (account.tokenVersion || 0) + 1
  await account.save()
}

// ──────────────────────────────────────────────
// 获取当前玩家信息
// ──────────────────────────────────────────────
export async function getPlayerInfo(playerId) {
  const account = await GamePlayerAccount.findById(playerId)
    .select('isGuest email')
    .lean()
  const playerInfo = await GamePlayerInfo.findOne({ account: playerId })
    .select(
      'account guildName gold guildLevel hasCustomGuildIcon customGuildIconUpdatedAt adventurerCount dungeonsLevel selectedDungeonsLevel dungeonsBackgroundId dungeonsCryRates lastDungeonSettleAt mapCanChangeUses lastMapRecoverAt miningCanUses lastMiningRecoverAt createdAt'
    )
    .lean()
  if (playerInfo && account) {
    playerInfo.isGuest = account.isGuest || false
    playerInfo.email = account.email
  }
  return playerInfo
}

// ──────────────────────────────────────────────
// 修改密码
// ──────────────────────────────────────────────

/**
 * 玩家修改密码（需要验证原密码）
 */
export async function changePassword(
  playerId,
  { currentPassword, newPassword }
) {
  const account = await GamePlayerAccount.findById(playerId)
  if (!account) {
    const err = new Error('用户不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const passwordMatch = await account.comparePassword(currentPassword)
  if (!passwordMatch) {
    const err = new Error('当前密码错误')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  account.password = newPassword
  account.tokenVersion = (account.tokenVersion || 0) + 1
  await account.save()
}

// ──────────────────────────────────────────────
// 游客注册
// ──────────────────────────────────────────────

/**
 * 生成 10 位随机账号（小写字母 + 数字）
 */
function generateGuestUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成 8 位随机密码（必须包含大小写字母、数字和符号）
 */
function generateGuestPassword() {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const symbols = '!@#$%^&*'
  const all = lower + upper + digits + symbols

  // 确保每种字符至少一个
  const password = [
    lower[Math.floor(Math.random() * lower.length)],
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ]

  // 补足剩余4位
  for (let i = 0; i < 4; i++) {
    password.push(all[Math.floor(Math.random() * all.length)])
  }

  // 打乱顺序
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[password[i], password[j]] = [password[j], password[i]]
  }

  return password.join('')
}

/**
 * 游客注册
 */
export async function guestRegister(req) {
  const ip = getUserIp(req)

  // 检查是否开启游客模式
  const gameSettings = global.$globalConfig?.gameSettings || {}
  if (gameSettings.guestModeEnabled === false) {
    const err = new Error('游客模式已关闭')
    err.statusCode = 403
    err.expose = true
    throw err
  }

  // 检测 isBot
  const ua = deviceUAInfoUtils(req)
  const type = ua?.browser?.type || null
  const botTypes = ['cli', 'crawler', 'fetcher', 'library']
  const isBot = type && botTypes.includes(type)
  if (isBot) {
    const err = new Error('检测到机器人行为，注册被拒绝')
    err.statusCode = 403
    err.expose = true
    throw err
  }

  // 每日同 IP 游客注册次数限制
  const maxGuestPerIpPerDay = gameSettings.guestMaxPerIpPerDay ?? 3
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const ipGuestCount = await GamePlayerRegisterLog.countDocuments({
    ip,
    success: true,
    isGuest: true,
    createdAt: { $gte: todayStart }
  })
  if (ipGuestCount >= maxGuestPerIpPerDay) {
    const err = new Error(
      `该 IP 今日游客注册次数已达上限（${maxGuestPerIpPerDay} 次）`
    )
    err.statusCode = 429
    err.expose = true
    throw err
  }

  // 全局 24 小时游客注册限制
  const dailyGuestLimit = gameSettings.dailyGuestRegisterLimit ?? 200
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const dailyGuestCount = await GamePlayerRegisterLog.countDocuments({
    success: true,
    isGuest: true,
    createdAt: { $gte: twentyFourHoursAgo }
  })
  if (dailyGuestCount >= dailyGuestLimit) {
    const err = new Error('系统游客注册已达每日上限，请稍后再试')
    err.statusCode = 429
    err.expose = true
    throw err
  }

  // 生成游客邮箱
  const siteSettings = global.$globalConfig?.siteSettings || {}
  const siteUrl = siteSettings.siteUrl || 'wikimoe.com'
  // 从 siteUrl 提取域名
  let domain = siteUrl
  try {
    const url = new URL(
      siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
    )
    domain = url.hostname
  } catch {
    // 使用原始值
  }

  // 生成唯一的游客邮箱
  let guestEmail = ''
  let attempts = 0
  while (attempts < 10) {
    guestEmail = `${generateGuestUsername()}@${domain}`
    const existing = await GamePlayerAccount.findOne({ email: guestEmail })
    if (!existing) break
    attempts++
  }
  if (attempts >= 10) {
    const err = new Error('游客账号生成失败，请稍后重试')
    err.statusCode = 500
    err.expose = true
    throw err
  }

  const guestPassword = generateGuestPassword()
  const guildName = generateRandomGuildName()

  return await executeInLock(`guest-register:${ip}`, async () => {
    // 公会名唯一性检查（极低概率冲突，但需要）
    const existingGuildName = await GamePlayerInfo.findOne({ guildName })
    if (existingGuildName) {
      const err = new Error('公会名冲突，请重试')
      err.statusCode = 409
      err.expose = true
      throw err
    }

    // 创建账号
    const account = await GamePlayerAccount.create({
      email: guestEmail,
      password: guestPassword,
      isGuest: true
    })

    // 创建玩家信息
    const playerInfo = await GamePlayerInfo.create({
      account: account._id,
      guildName
    })

    // 创建初始冒险家
    const ELEMENTS = ['1', '2', '3', '4', '5', '6']
    const PASSIVE_BUFF_TYPES = ['1', '2', '3', '4', '5', '6']
    const randomElement = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]
    const randomPassiveBuff =
      PASSIVE_BUFF_TYPES[Math.floor(Math.random() * PASSIVE_BUFF_TYPES.length)]
    await GameAdventurer.create({
      account: account._id,
      elements: randomElement,
      passiveBuffType: randomPassiveBuff,
      defaultAvatarId: generateRandomAdventurerAvatarId(),
      name: generateRandomAdventurerName()
    })
    // 冒险家计数 +1
    await GamePlayerInfo.updateOne(
      { _id: playerInfo._id },
      { $inc: { adventurerCount: 1 } }
    )

    // 创建玩家背包
    await GamePlayerInventory.create({ account: account._id })

    // 记录注册日志
    const log = await GamePlayerRegisterLog.create({
      email: guestEmail,
      ip,
      success: true,
      isGuest: true,
      message: '游客注册成功'
    })
    IP2LocationUtils(ip, log._id, GamePlayerRegisterLog).catch(() => {})
    deviceUtils(req, log._id, GamePlayerRegisterLog)

    // 生成公会图标
    await generateIconAsync(String(account._id)).catch(err => {
      console.error('生成公会图标失败', err)
    })

    // 记录动态：创建公会
    recordActivity({
      type: 'guild_created',
      account: account._id,
      guildName,
      title: `公会「${guildName}」已创建`,
      content: '欢迎新公会加入冒险！'
    })

    // 签发 Token（游客使用10年有效期）
    const tokens = signPlayerTokens(account, false, { isGuest: true })
    const info = await GamePlayerInfo.findOne({ account: account._id })
      .select(
        'account guildName gold hasCustomGuildIcon customGuildIconUpdatedAt adventurerCount dungeonsLevel selectedDungeonsLevel dungeonsBackgroundId dungeonsCryRates lastDungeonSettleAt mapCanChangeUses lastMapRecoverAt miningCanUses lastMiningRecoverAt createdAt'
      )
      .lean()

    return {
      ...tokens,
      playerInfo: info,
      guestEmail,
      guestPassword
    }
  })
}

// ──────────────────────────────────────────────
// 游客绑定邮箱
// ──────────────────────────────────────────────

/**
 * 游客绑定邮箱 - 发送验证码
 */
export async function guestBindEmailSendCode(req, email) {
  const account = await GamePlayerAccount.findById(req.player.id)
  if (!account) {
    const err = new Error('用户不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  if (!account.isGuest) {
    const err = new Error('非游客账号无法使用此功能')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 检查邮箱是否已被注册
  const existing = await GamePlayerAccount.findOne({ email })
  if (existing) {
    const err = new Error('该邮箱已被注册')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 调用已有的 sendMailCode 逻辑
  await sendMailCode(req, email, 'guestBind')
}

/**
 * 游客绑定邮箱
 */
export async function guestBindEmail(playerId, { email, code }) {
  // 校验验证码
  await verifyMailCode(email, code)

  return await executeInLock(`guest-bind:${playerId}`, async () => {
    const account = await GamePlayerAccount.findById(playerId)
    if (!account) {
      const err = new Error('用户不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }
    if (!account.isGuest) {
      const err = new Error('非游客账号无法使用此功能')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 再次检查邮箱唯一性
    const existing = await GamePlayerAccount.findOne({ email })
    if (existing) {
      const err = new Error('该邮箱已被注册')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 更新邮箱并取消游客标记
    account.email = email
    account.isGuest = false
    account.tokenVersion = (account.tokenVersion || 0) + 1
    await account.save()

    // 重新签发 token
    const tokens = signPlayerTokens(account, false)
    return { ...tokens, email }
  })
}

// ──────────────────────────────────────────────
// 获取游客模式配置（前端用）
// ──────────────────────────────────────────────
export function getGuestConfig() {
  const gameSettings = global.$globalConfig?.gameSettings || {}
  return {
    guestModeEnabled: gameSettings.guestModeEnabled !== false
  }
}
