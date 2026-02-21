import * as loginLogService from '../../services/admin/loginLogService.js'

/**
 * 获取管理员登录历史列表
 */
export async function list(req, res, next) {
  try {
    const result = await loginLogService.list(req.query)
    res.success(result, '获取登录历史成功')
  } catch (error) {
    next(error)
  }
}
