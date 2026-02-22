import adminRequest from './request.js'

/**
 * 获取管理员列表
 * @param {{ page?: number, pageSize?: number, username?: string }} params
 */
export function listAdminsApi(params = {}) {
  return adminRequest.get('/admins', { params })
}

/**
 * 创建管理员（role=990）
 * @param {{ username: string, password: string }} data
 */
export function createAdminApi(data) {
  return adminRequest.post('/admins', data)
}

/**
 * 更新管理员
 * @param {string} id
 * @param {{ username?: string, password?: string }} data
 */
export function updateAdminApi(id, data) {
  return adminRequest.put(`/admins/${id}`, data)
}
