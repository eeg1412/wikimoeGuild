import adminRequest from './request.js'

/**
 * 检查是否已完成初始化
 */
export function checkInitedApi() {
  return adminRequest.get('/check-inited')
}

/**
 * 执行站点初始化
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.password
 * @param {string} data.siteTitle
 * @param {string} data.siteSubTitle
 * @param {string} data.siteUrl
 */
export function installApi(data) {
  return adminRequest.post('/install', data)
}
