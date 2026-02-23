import * as authService from '../../services/admin/authService.js'

/**
 * 管理员登录
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req, req.body)
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
    const admin = await authService.getProfile(req.admin.id)
    res.success(admin, '获取管理员信息成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改管理员自身密码
 */
export async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.admin.id, req.body)
    res.success(null, '密码修改成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 刷新管理员 Token
 */
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.unauthorized('请提供刷新令牌')
    }
    const result = await authService.refreshAdminToken(refreshToken)
    res.success(result, '令牌刷新成功')
  } catch (error) {
    next(error)
  }
}
