import gameRequest from './request.js'

/**
 * 获取我的冒险家列表
 */
export function getMyAdventurersApi() {
  return gameRequest.get('/adventurers/my')
}

/**
 * 获取冒险家详情
 */
export function getAdventurerDetailApi(id) {
  return gameRequest.get(`/adventurers/${id}`)
}

/**
 * 招募冒险家
 */
export function recruitAdventurerApi() {
  return gameRequest.post('/adventurers/recruit')
}

/**
 * 自定义头像
 */
export function customizeAvatarApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/avatar`, data)
}

/**
 * 自定义名字
 */
export function customizeNameApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/name`, data)
}

/**
 * 属性升级
 */
export function levelUpStatApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/level-up`, data)
}

/**
 * 装备符文石
 */
export function equipRuneStoneApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/equip`, data)
}

/**
 * 卸下符文石
 */
export function unequipRuneStoneApi(id) {
  return gameRequest.post(`/adventurers/${id}/unequip`)
}
