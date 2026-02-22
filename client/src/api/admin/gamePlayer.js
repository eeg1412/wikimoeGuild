import adminRequest from './request.js'

export function listGamePlayersApi(params) {
  return adminRequest.get('/game-players', { params })
}
