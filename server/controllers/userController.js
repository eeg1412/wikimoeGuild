import * as userService from '../services/userService.js'
import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 注册
 */
export async function register(req, res, next) {
  try {
    const user = await userService.register(req.body)
    res.status(HTTP_CODE.CREATED).json({
      code: BIZ_CODE.SUCCESS,
      message: '注册成功',
      data: user
    })
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
    res.json({
      code: BIZ_CODE.SUCCESS,
      message: '登录成功',
      data: result
    })
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
    res.json({
      code: BIZ_CODE.SUCCESS,
      data: user
    })
  } catch (error) {
    next(error)
  }
}
