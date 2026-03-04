import * as arenaSeasonService from '../../services/admin/arenaSeasonService.js'

export async function getCurrentSeason(req, res, next) {
  try {
    const result = await arenaSeasonService.getCurrentSeason()
    res.success(result, '获取当前赛季成功')
  } catch (error) {
    next(error)
  }
}

export async function updateCurrentSeasonTime(req, res, next) {
  try {
    const result = await arenaSeasonService.updateCurrentSeasonTime(req.body)
    res.success(result, '当前赛季时间更新成功')
  } catch (error) {
    next(error)
  }
}
