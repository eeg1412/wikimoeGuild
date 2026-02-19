import adminRequest from './request.js'

export function adminLoginApi(data) {
  return adminRequest.post('/auth/login', data)
}

export function adminProfileApi() {
  return adminRequest.get('/auth/profile')
}
