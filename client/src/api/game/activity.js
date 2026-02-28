import gameRequest from './request.js'

/**
 * 获取玩家动态列表（公开接口，无需登录）
 */
export function getActivitiesApi(params) {
  return gameRequest.get('/activity/list', { params })
}
