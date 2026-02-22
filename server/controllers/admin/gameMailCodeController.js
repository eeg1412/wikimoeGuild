import * as gameMailCodeService from '../../services/admin/gameMailCodeService.js'

export async function list(req, res, next) {
  try {
    const result = await gameMailCodeService.list(req.query)
    res.success(result, '获取验证码列表成功')
  } catch (error) {
    next(error)
  }
}

export async function deleteOne(req, res, next) {
  try {
    await gameMailCodeService.deleteOne(req.params.id)
    res.success(null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export async function batchDelete(req, res, next) {
  try {
    const result = await gameMailCodeService.batchDelete(req.body)
    res.success(result, `批量删除成功，共删除 ${result.deletedCount} 条`)
  } catch (error) {
    next(error)
  }
}
