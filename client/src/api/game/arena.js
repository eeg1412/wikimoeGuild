import gameRequest from './request.js'

export function getArenaInfoApi() {
  return gameRequest.get('/arena/info')
}

export function registerArenaApi(data) {
  return gameRequest.post('/arena/register', data)
}

export function updateArenaFormationApi(data) {
  return gameRequest.put('/arena/formation', data)
}

export function getArenaFormationApi() {
  return gameRequest.get('/arena/formation')
}

export function getMatchListApi() {
  return gameRequest.get('/arena/match-list')
}

export function challengeOpponentApi(data) {
  return gameRequest.post('/arena/challenge', data)
}

export function getMyBattleLogsApi(params) {
  return gameRequest.get('/arena/battle-logs', { params })
}

export function getBattleLogDetailApi(logId) {
  return gameRequest.get(`/arena/battle-logs/${logId}`)
}

export function getLeaderboardApi(params) {
  return gameRequest.get('/arena/leaderboard', { params })
}
