import gameRequest from './request.js'

/**
 * 修改公会标志
 */
export function changeGuildLogoApi(data) {
  return gameRequest.post('/guild/logo', data)
}

/**
 * 修改公会名字
 */
export function changeGuildNameApi(data) {
  return gameRequest.post('/guild/name', data)
}

/**
 * 获取指定玩家的公会信息
 */
export function getGuildInfoApi(playerInfoId) {
  return gameRequest.get(`/guild/info/${playerInfoId}`)
}

/**
 * 获取公会等级升级进度信息
 */
export function getGuildLevelInfoApi() {
  return gameRequest.get('/guild/level-info')
}

/**
 * 公会等级升级
 */
export function upgradeGuildLevelApi() {
  return gameRequest.post('/guild/level-up')
}
