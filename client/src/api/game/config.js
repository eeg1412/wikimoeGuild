import gameRequest from './request.js'

/**
 * 获取站点配置（siteSettings）
 */
export function getSiteSettingsApi() {
  return gameRequest.get('/config/site-settings')
}

/**
 * 获取游戏配置（价格等）
 */
export function getGameSettingsApi() {
  return gameRequest.get('/config/game-settings')
}
