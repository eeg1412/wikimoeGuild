import * as gamePlayerService from '../../services/admin/gamePlayerService.js'

export async function list(req, res, next) {
  try {
    const result = await gamePlayerService.list(req.query)
    res.success(result, '获取玩家列表成功')
  } catch (error) {
    next(error)
  }
}
