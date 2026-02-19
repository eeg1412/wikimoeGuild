import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../config/jwtKeys.js'
import { JWT_CONFIG } from '../config/jwt.js'

/**
 * 用户注册
 */
export async function register({ username, email, password }) {
  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (existingUser) {
    const err = new Error('用户名或邮箱已存在')
    err.statusCode = 409
    err.expose = true
    throw err
  }

  const user = new User({ username, email, password })
  await user.save()
  return user.toJSON()
}

/**
 * 用户登录
 */
export async function login({ username, password }) {
  const user = await User.findOne({ username })
  if (!user) {
    const err = new Error('用户名或密码错误')
    err.statusCode = 401
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
    jwtKeys.userSecret,
    { expiresIn: JWT_CONFIG.user.expiresIn }
  )

  return { user: user.toJSON(), token }
}

/**
 * 获取用户信息
 */
export async function getUserById(id) {
  const user = await User.findById(id)
  if (!user) {
    const err = new Error('用户不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return user.toJSON()
}
