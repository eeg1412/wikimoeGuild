import adminRequest from './request.js'

/**
 * 获取冒险家列表
 */
export function listGameAdventurersApi(params) {
  return adminRequest.get('/game-adventurers', { params })
}

/**
 * 修改冒险家名字
 */
export function renameGameAdventurerApi(id, data) {
  return adminRequest.put(`/game-adventurers/${id}/rename`, data)
}

/**
 * 重置冒险家头像为默认
 */
export function resetAdventurerAvatarApi(id) {
  return adminRequest.put(`/game-adventurers/${id}/reset-avatar`)
}
