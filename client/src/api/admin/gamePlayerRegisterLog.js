import adminRequest from './request.js'

export function listGamePlayerRegisterLogsApi(params) {
  return adminRequest.get('/game-player-register-logs', { params })
}

export function deleteGamePlayerRegisterLogApi(id) {
  return adminRequest.delete(`/game-player-register-logs/${id}`)
}

export function batchDeleteGamePlayerRegisterLogsApi(data) {
  return adminRequest.delete('/game-player-register-logs/batch', { data })
}
