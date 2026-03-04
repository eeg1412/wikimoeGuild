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
 * 属性降级
 */
export function levelDownStatApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/level-down`, data)
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

/**
 * 冒险家洗属性（元素/被动增益/攻击偏好）
 */
export function rerollAttributeApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/reroll`, data)
}

/**
 * 设置角色标记
 */
export function setRoleTagApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/role-tag`, data)
}

/**
 * 批量装备最高级符文石
 */
export function batchEquipBestRuneStonesApi(data) {
  return gameRequest.post('/adventurers/batch-equip-best', data)
}

/**
 * 保存属性自动分配比例
 */
export function saveDistributeRatioApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/distribute-ratio`, data)
}

/**
 * 自动分配升级
 */
export function autoDistributeLevelUpApi(id, data) {
  return gameRequest.post(`/adventurers/${id}/auto-distribute-level-up`, data)
}

/**
 * 批量按比例升降级
 */
export function batchRatioDistributeApi(data) {
  return gameRequest.post('/adventurers/batch-ratio-distribute', data)
}
