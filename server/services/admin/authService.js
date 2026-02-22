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

  const token = jwt.sign(
    { id: account._id, username: account.username, role: account.role },
    jwtKeys.adminSecret,
    {
      expiresIn: rememberMe
        ? JWT_CONFIG.admin.rememberMeExpiresIn
        : JWT_CONFIG.admin.expiresIn
    }
  )

  await recordLoginLog(req, {
    username: safeUsername,
    success: true,
    message: '登录成功'
  })

  return { admin: account.toJSON(), token }
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
  await account.save()
}
