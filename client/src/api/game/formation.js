import gameRequest from './request.js'

/**
 * 获取我的阵容列表
 */
export function getMyFormationsApi() {
  return gameRequest.get('/formations/my')
}

/**
 * 获取阵容详情
 */
export function getFormationDetailApi(id) {
  return gameRequest.get(`/formations/${id}`)
}

/**
 * 保存阵容
 */
export function saveFormationApi(data) {
  return gameRequest.post('/formations/save', data)
}

/**
 * 删除阵容
 */
export function deleteFormationApi(slot) {
  return gameRequest.delete(`/formations/${slot}`)
}
