import gameRequest from './request.js'

/**
 * 获取我的背包
 */
export function getMyInventoryApi() {
  return gameRequest.get('/inventory/my')
}
