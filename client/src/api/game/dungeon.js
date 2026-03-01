import gameRequest from './request.js'

/**
 * 获取地牢信息
 */
export function getDungeonInfoApi() {
  return gameRequest.get('/dungeon/info')
}

/**
 * 切换地牢
 */
export function switchDungeonApi() {
  return gameRequest.post('/dungeon/switch')
}

/**
 * 结算收取水晶
 */
export function settleCrystalsApi() {
  return gameRequest.post('/dungeon/settle')
}

/**
 * 预览军团恶魔
 */
export function previewLegionApi() {
  return gameRequest.get('/dungeon/legion/preview')
}

/**
 * 选择迷宫产出等级
 */
export function selectDungeonLevelApi(data) {
  return gameRequest.post('/dungeon/select-level', data)
}

/**
 * 挑战军团
 */
export function challengeLegionApi(data) {
  return gameRequest.post('/dungeon/legion/challenge', data)
}
