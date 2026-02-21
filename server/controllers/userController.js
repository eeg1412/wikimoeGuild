import * as userService from '../services/userService.js'

/**
 * 注册
 */
export async function register(req, res, next) {
  try {
    const user = await userService.register(req.body)
    res.created(user, '注册成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 登录
 */
export async function login(req, res, next) {
  try {
    const result = await userService.login(req.body)
    res.success(result, '登录成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id)
    res.success(user)
  } catch (error) {
    next(error)
  }
}
