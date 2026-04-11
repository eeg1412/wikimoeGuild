import adminRequest from './request.js'

export function listBotsApi(params) {
  return adminRequest.get('/game-bots', { params })
}

export function getBotDetailApi(id) {
  return adminRequest.get(`/game-bots/${id}`)
}

export function createBotApi(data) {
  return adminRequest.post('/game-bots', data)
}

export function updateBotApi(id, data) {
  return adminRequest.put(`/game-bots/${id}`, data)
}

export function updateBotGuildNameApi(id, data) {
  return adminRequest.put(`/game-bots/${id}/guild-name`, data)
}

export function updateBotGuildIconApi(id, data) {
  return adminRequest.put(`/game-bots/${id}/guild-icon`, data)
}

export function updateBotAdventurerNameApi(id, data) {
  return adminRequest.put(`/game-bots/${id}/adventurer-name`, data)
}

export function updateBotAdventurerAvatarApi(id, data) {
  return adminRequest.put(`/game-bots/${id}/adventurer-avatar`, data)
}

export function triggerBotActionApi(id) {
  return adminRequest.post(`/game-bots/${id}/trigger`)
}
