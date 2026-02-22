import adminRequest from './request.js'

export function listGameMailCodesApi(params) {
  return adminRequest.get('/game-mail-codes', { params })
}

export function deleteGameMailCodeApi(id) {
  return adminRequest.delete(`/game-mail-codes/${id}`)
}

export function batchDeleteGameMailCodesApi(data) {
  return adminRequest.delete('/game-mail-codes/batch', { data })
}
