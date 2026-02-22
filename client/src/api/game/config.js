import gameRequest from './request.js'

/**
 * 获取站点配置（siteSettings）
 */
export function getSiteSettingsApi() {
  return gameRequest.get('/config/site-settings')
}
