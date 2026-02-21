import adminRequest from './request.js'

/**
 * 获取管理员登录历史列表
 * @param {object} params
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 * @param {string} [params.username]
 * @param {string} [params.ip]
 * @param {string} [params.success]
 */
export function listLoginLogApi(params) {
  return adminRequest.get('/login-log', { params })
}
