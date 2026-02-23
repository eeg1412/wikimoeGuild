import gameRequest from './request.js'

/**
 * 获取我的冒险家列表
 */
export function getMyAdventurersApi() {
  return gameRequest.get('/adventurers/my')
}
