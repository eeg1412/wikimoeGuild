/**
 * 获取游戏前端所需的全局配置（siteSettings）
 */
export async function getSiteSettings(req, res, next) {
  try {
    const siteSettings = global.$globalConfig?.siteSettings || {}
    res.success(siteSettings, '获取成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取游戏前端所需的游戏配置（gameSettings）
 */
export async function getGameSettings(req, res, next) {
  try {
    const gameSettings = global.$globalConfig?.gameSettings || {}
    res.success(
      {
        adventurerRecruitPrice: gameSettings.adventurerRecruitPrice ?? 10000,
        adventurerCustomAvatarPrice:
          gameSettings.adventurerCustomAvatarPrice ?? 5000,
        adventurerCustomNamePrice:
          gameSettings.adventurerCustomNamePrice ?? 1000,
        guildCustomLogoPrice: gameSettings.guildCustomLogoPrice ?? 5000,
        guildChangeNamePrice: gameSettings.guildChangeNamePrice ?? 1000
      },
      '获取成功'
    )
  } catch (error) {
    next(error)
  }
}
