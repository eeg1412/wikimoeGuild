import User from '../../models/User.js'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../../config/jwtKeys.js'
import { JWT_CONFIG } from '../../config/jwt.js'
import { ROLES } from 'shared'

/**
 * 管理员登录
 */
export async function login({ username, password }) {
  const user = await User.findOne({ username })
  if (!user) {
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  if (user.role !== ROLES.ADMIN) {
    const err = new Error('无管理员权限')
    err.statusCode = 403
    err.expose = true
    throw err
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
    err.expose = true
    throw err
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    jwtKeys.adminSecret,
    { expiresIn: JWT_CONFIG.admin.expiresIn }
  )

  return { user: user.toJSON(), token }
}

/**
 * 获取管理员信息
 */
export async function getProfile(id) {
  const user = await User.findById(id)
  if (!user) {
    const err = new Error('用户不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return user.toJSON()
}
