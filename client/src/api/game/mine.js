import gameRequest from './request.js'

/**
 * 获取矿场列表
 */
export function listMinesApi(params) {
  return gameRequest.get('/mine/list', { params })
}

/**
 * 获取矿场详情
 */
export function getMineDetailApi(mineId) {
  return gameRequest.get(`/mine/${mineId}`)
}

/**
 * 获取挖矿信息
 */
export function getMiningInfoApi() {
  return gameRequest.get('/mine/mining-info')
}

/**
 * 挖矿
 */
export function digCellApi(mineId, data) {
  return gameRequest.post(`/mine/${mineId}/dig`, data)
}

/**
 * 获取矿主收益
 */
export function getOwnerRevenueApi(params) {
  return gameRequest.get('/mine/revenue', { params })
}

/**
 * 创建矿场 SSE 连接
 * @param {string} mineId
 * @returns {EventSource}
 */
export function createMineSSE(mineId) {
  const token = localStorage.getItem('playerAccessToken')
  // SSE 不支持自定义 header，通过 query 传递 token
  return new EventSource(
    `/api/game/mine/${mineId}/sse?token=${encodeURIComponent(token)}`
  )
}
