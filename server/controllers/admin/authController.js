import * as authService from '../../services/admin/authService.js'

/**
 * 管理员登录
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body)
    res.success(result, '登录成功')
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
    res.success(user)
  } catch (error) {
    next(error)
  }
}
