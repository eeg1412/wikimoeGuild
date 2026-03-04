import adminRequest from './request.js'

export function getCurrentAdminArenaSeasonApi() {
  return adminRequest.get('/arena-season/current')
}

export function updateCurrentAdminArenaSeasonTimeApi(data) {
  return adminRequest.put('/arena-season/current/time', data)
}
