import adminRequest from './request.js'

export function listGamePlayersApi(params) {
  return adminRequest.get('/game-players', { params })
}

export function banGamePlayerApi(data) {
  return adminRequest.post('/game-players/ban', data)
}

export function changeGamePlayerPasswordApi(id, data) {
  return adminRequest.put(`/game-players/${id}/password`, data)
}

export function listGamePlayerBanLogsApi(params) {
  return adminRequest.get('/game-players/ban-logs', { params })
}

export function deleteGamePlayerBanLogApi(id) {
  return adminRequest.delete(`/game-players/ban-logs/${id}`)
}
