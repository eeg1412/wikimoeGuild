import adminAccount from '../../models/adminAccounts.js'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../../config/jwtKeys.js'
import { JWT_CONFIG } from '../../config/jwt.js'
import {
  checkIpRateLimit,
  checkUsernameRateLimit,
  recordLoginLog
} from './loginLogService.js'
import { getUserIp, limitStr } from '../../utils/utils.js'

/**
 * 管理员登录
 * @param {import('express').Request} req
 * @param {object} body
 */
export async function login(req, { username, password, rememberMe = false }) {
  const ip = getUserIp(req)
  // 截断 username，防止超长字符绕过日志限制
  const safeUsername = limitStr(username, 30)

  // 频率限制：先检查 IP 和账号
  await checkIpRateLimit(ip)
  await checkUsernameRateLimit(safeUsername)

  const account = await adminAccount.findOne({ username: safeUsername })
  if (!account) {
    await recordLoginLog(req, {
      username: safeUsername,
      success: false,
      message: '用户名或密码错误'
    })
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const isMatch = await account.comparePassword(password)
  if (!isMatch) {
    await recordLoginLog(req, {
      username: safeUsername,
      success: false,
      message: '用户名或密码错误'
    })
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const { accessToken, refreshToken } = signAdminTokens(account, rememberMe)

  await recordLoginLog(req, {
    username: safeUsername,
    success: true,
    message: '登录成功'
  })

  return { admin: account.toJSON(), accessToken, refreshToken }
}

/**
 * 签发管理员双 Token
 * @param {object} account  - 账号文档
 * @param {boolean} rememberMe - 是否保持登录
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function signAdminTokens(account, rememberMe) {
  const payload = {
    id: account._id,
    username: account.username,
    role: account.role,
    tokenVersion: account.tokenVersion
  }
  const accessToken = jwt.sign(
    { ...payload, tokenType: 'access' },
    jwtKeys.adminSecret,
    { expiresIn: JWT_CONFIG.admin.accessTokenExpiresIn }
  )
  const refreshToken = jwt.sign(
    { ...payload, tokenType: 'refresh', rememberMe: !!rememberMe },
    jwtKeys.adminSecret,
    {
      expiresIn: rememberMe
        ? JWT_CONFIG.admin.rememberMeRefreshTokenExpiresIn
        : JWT_CONFIG.admin.refreshTokenExpiresIn
    }
  )
  return { accessToken, refreshToken }
}

/**
 * 刷新管理员 Token
 * 校验 refreshToken 的 tokenVersion，不吻合则吊销
 */
export async function refreshAdminToken(refreshTokenStr) {
  let decoded
  try {
    decoded = jwt.verify(refreshTokenStr, jwtKeys.adminSecret)
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

  const account = await adminAccount.findById(decoded.id)
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
  return signAdminTokens(account, rememberMe)
}

/**
 * 获取管理员信息
 */
export async function getProfile(id) {
  const account = await adminAccount.findById(id)
  if (!account) {
    const err = new Error('用户不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return account.toJSON()
}

/**
 * 修改管理员自身密码
 * @param {string} id          JWT 中的管理员 ID
 * @param {string} currentPassword  当前密码
 * @param {string} newPassword      新密码
 */
export async function changePassword(id, { currentPassword, newPassword }) {
  const account = await adminAccount.findById(id)
  if (!account) {
    const err = new Error('用户不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const isMatch = await account.comparePassword(currentPassword)
  if (!isMatch) {
    const err = new Error('当前密码错误')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  account.password = newPassword
  account.tokenVersion = (account.tokenVersion || 0) + 1
  await account.save()
}
