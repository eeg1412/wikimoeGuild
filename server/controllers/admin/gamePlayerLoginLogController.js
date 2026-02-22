import * as gamePlayerLoginLogService from '../../services/admin/gamePlayerLoginLogService.js'

export async function list(req, res, next) {
  try {
    const result = await gamePlayerLoginLogService.list(req.query)
    res.success(result, '获取玩家登录日志成功')
  } catch (error) {
    next(error)
  }
}

export async function deleteOne(req, res, next) {
  try {
    await gamePlayerLoginLogService.deleteOne(req.params.id)
    res.success(null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export async function batchDelete(req, res, next) {
  try {
    const result = await gamePlayerLoginLogService.batchDelete(req.body)
    res.success(result, `批量删除成功，共删除 ${result.deletedCount} 条`)
  } catch (error) {
    next(error)
  }
}
