import adminRequest from './request.js'

export function listGlobalConfigApi(params) {
  return adminRequest.get('/global-config', { params })
}

export function getGlobalConfigApi(id) {
  return adminRequest.get(`/global-config/${id}`)
}

export function createGlobalConfigApi(data) {
  return adminRequest.post('/global-config', data)
}

export function updateGlobalConfigApi(id, data) {
  return adminRequest.put(`/global-config/${id}`, data)
}

export function deleteGlobalConfigApi(id) {
  return adminRequest.delete(`/global-config/${id}`)
}
