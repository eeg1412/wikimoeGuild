import * as authService from '../../services/admin/authService.js'
import { HTTP_CODE, BIZ_CODE } from 'shared'

/**
 * 管理员登录
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body)
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
 * 获取管理员信息
 */
export async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id)
    res.json({
      code: BIZ_CODE.SUCCESS,
      data: user
    })
  } catch (error) {
    next(error)
  }
}
