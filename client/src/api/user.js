import request from './request.js'

export function loginApi(data) {
  return request.post('/users/login', data)
}

export function registerApi(data) {
  return request.post('/users/register', data)
}

export function getProfileApi() {
  return request.get('/users/profile')
}
