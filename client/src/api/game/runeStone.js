import gameRequest from './request.js'

/**
 * 获取我的符文石列表
 */
export function getMyRuneStonesApi(params) {
  return gameRequest.get('/rune-stones/my', { params })
}

/**
 * 获取符文石详情
 */
export function getRuneStoneDetailApi(id) {
  return gameRequest.get(`/rune-stones/${id}`)
}

/**
 * 分解符文石
 */
export function decomposeRuneStoneApi(id) {
  return gameRequest.post(`/rune-stones/${id}/decompose`)
}

/**
 * 升级符文石
 */
export function upgradeRuneStoneApi(id) {
  return gameRequest.post(`/rune-stones/${id}/upgrade`)
}

/**
 * 预览符文石合成
 */
export function previewSynthesisApi(data) {
  return gameRequest.post('/rune-stones/synthesis/preview', data)
}

/**
 * 确认符文石合成
 */
export function confirmSynthesisApi(data) {
  return gameRequest.post('/rune-stones/synthesis/confirm', data)
}
