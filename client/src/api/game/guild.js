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
