import adminRequest from './request.js'

export function listGamePlayerLoginLogsApi(params) {
  return adminRequest.get('/game-player-login-logs', { params })
}

export function deleteGamePlayerLoginLogApi(id) {
  return adminRequest.delete(`/game-player-login-logs/${id}`)
}

export function batchDeleteGamePlayerLoginLogsApi(data) {
  return adminRequest.delete('/game-player-login-logs/batch', { data })
}
