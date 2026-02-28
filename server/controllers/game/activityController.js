import * as activityService from '../../services/game/activityService.js'

/**
 * 获取玩家动态列表（公开接口）
 */
export async function getActivities(req, res, next) {
  try {
    const { page, pageSize } = req.query
    const result = await activityService.getActivities({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20
    })
    res.success(result, '获取玩家动态成功')
  } catch (error) {
    next(error)
  }
}
