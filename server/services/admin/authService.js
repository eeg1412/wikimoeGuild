import adminAccount from '../../models/adminAccounts.js'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../../config/jwtKeys.js'
import { JWT_CONFIG } from '../../config/jwt.js'

/**
 * 管理员登录
 */
export async function login({ username, password, rememberMe = false }) {
  const account = await adminAccount.findOne({ username: username })
  if (!account) {
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const isMatch = await account.comparePassword(password)
  if (!isMatch) {
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const token = jwt.sign(
    { id: account._id, username: account.username },
    jwtKeys.adminSecret,
    {
      expiresIn: rememberMe
        ? JWT_CONFIG.admin.rememberMeExpiresIn
        : JWT_CONFIG.admin.expiresIn
    }
  )

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
