import GameArenaSeason from '../../models/gameArenaSeason.js'
import { executeInLock } from '../../utils/utils.js'

function formatSeasonForAdmin(season) {
  return {
    _id: season._id,
    seasonNumber: season.seasonNumber,
    startTime: season.startTime,
    endTime: season.endTime,
    status: season.status,
    poolAmount: season.poolAmount,
    participationReward: season.participationReward,
    battleGold: season.battleGold
  }
}

export async function getCurrentSeason() {
  const season = await GameArenaSeason.findOne({ status: 'active' })
    .sort({ seasonNumber: -1 })
    .lean()

  if (!season) return null
  return formatSeasonForAdmin(season)
}

export async function updateCurrentSeasonTime({ startTime, endTime }) {
  return executeInLock('admin:arena-season:update', async () => {
    const currentSeason = await GameArenaSeason.findOne({
      status: 'active'
    }).sort({ seasonNumber: -1 })

    if (!currentSeason) {
      const err = new Error('当前没有可设置的活跃赛季')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const nextStartTime = new Date(startTime)
    const nextEndTime = new Date(endTime)

    const latestPreviousSeason = await GameArenaSeason.findOne({
      seasonNumber: { $lt: currentSeason.seasonNumber }
    })
      .sort({ endTime: -1 })
      .lean()

    if (
      latestPreviousSeason?.endTime &&
      nextStartTime < new Date(latestPreviousSeason.endTime)
    ) {
      const err = new Error('开始时间不能早于任何以往赛季的结束时间')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    currentSeason.startTime = nextStartTime
    currentSeason.endTime = nextEndTime
    await currentSeason.save()

    return formatSeasonForAdmin(currentSeason.toJSON())
  })
}
