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
        guildChangeNamePrice: gameSettings.guildChangeNamePrice ?? 1000,
        runeStoneDropRate: gameSettings.runeStoneDropRate ?? 100,
        normalRuneStoneRate: gameSettings.normalRuneStoneRate ?? 8000,
        rareRuneStoneRate: gameSettings.rareRuneStoneRate ?? 1500,
        legendaryRuneStoneRate: gameSettings.legendaryRuneStoneRate ?? 500,
        officialCrystalBuyPrice: gameSettings.officialCrystalBuyPrice ?? 100,
        officialCrystalSellPrice:
          gameSettings.officialCrystalSellPrice ?? 10000,
        freeMarketMinPrice: gameSettings.freeMarketMinPrice ?? 100,
        freeMarketRuneStoneMinPrice:
          gameSettings.freeMarketRuneStoneMinPrice ?? 100,
        arenaPoolAmount: gameSettings.arenaPoolAmount ?? 100000,
        arenaParticipationReward: gameSettings.arenaParticipationReward ?? 500,
        arenaBattleGold: gameSettings.arenaBattleGold ?? 50,
        seasonDays: gameSettings.seasonDays ?? 3
      },
      '获取成功'
    )
  } catch (error) {
    next(error)
  }
}
