import adminRequest from './request.js'

export function adminLoginApi(data) {
  return adminRequest.post('/auth/login', data)
}

export function adminProfileApi() {
  return adminRequest.get('/auth/profile')
}

/**
 * 修改管理员自身密码
 * @param {{ currentPassword: string, newPassword: string }} data
 */
export function changePasswordApi(data) {
  return adminRequest.put('/auth/password', data)
}
