import adminRequest from './request.js'

// 通用 API
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

// 分类 API
// 站点设置
export function getSiteSettingsApi() {
  return adminRequest.get('/global-config/site')
}

export function updateSiteSettingsApi(data) {
  return adminRequest.put('/global-config/site', data)
}

// 邮箱设置
export function getEmailSettingsApi() {
  return adminRequest.get('/global-config/email')
}

export function updateEmailSettingsApi(data) {
  return adminRequest.put('/global-config/email', data)
}

// 安全设置
export function getSecuritySettingsApi() {
  return adminRequest.get('/global-config/security')
}

export function updateSecuritySettingsApi(data) {
  return adminRequest.put('/global-config/security', data)
}

// 广告设置
export function getAdSettingsApi() {
  return adminRequest.get('/global-config/ad')
}

export function updateAdSettingsApi(data) {
  return adminRequest.put('/global-config/ad', data)
}
