export const botWeightFields = [
  { key: 'switchDungeon', label: '切换地牢' },
  { key: 'dungeonBattle', label: '地牢战斗' },
  { key: 'arenaBattle', label: '竞技场' },
  { key: 'mineExplore', label: '矿场探索' },
  { key: 'runeStoneManage', label: '符文石管理' },
  { key: 'formationManage', label: '阵容管理' },
  { key: 'idle', label: '发呆概率' }
]

export const botWeightPresets = {
  积极战斗: {
    switchDungeon: 50,
    dungeonBattle: 95,
    arenaBattle: 90,
    mineExplore: 60,
    runeStoneManage: 70,
    formationManage: 75,
    idle: 5
  },
  稳健成长: {
    switchDungeon: 40,
    dungeonBattle: 65,
    arenaBattle: 50,
    mineExplore: 70,
    runeStoneManage: 60,
    formationManage: 60,
    idle: 25
  },
  低频活跃: {
    switchDungeon: 30,
    dungeonBattle: 45,
    arenaBattle: 30,
    mineExplore: 40,
    runeStoneManage: 40,
    formationManage: 40,
    idle: 50
  },
  竞技专精: {
    switchDungeon: 35,
    dungeonBattle: 70,
    arenaBattle: 95,
    mineExplore: 50,
    runeStoneManage: 65,
    formationManage: 80,
    idle: 10
  }
}

export function createDefaultBotSettings() {
  return {
    isActive: true,
    formationTendency: 'balanced',
    behaviorWeights: {
      switchDungeon: 40,
      dungeonBattle: 70,
      arenaBattle: 60,
      mineExplore: 50,
      runeStoneManage: 50,
      formationManage: 60,
      idle: 20
    },
    marketSettings: {
      sellCrystals: {
        maxMarketAmount: 0
      },
      sellRuneStones: {
        enabled: false,
        maxAmount: 3,
        rarities: ['legendary']
      }
    },
    activeTimeSettings: {
      enabled: true,
      startHour: 8,
      endHour: 23
    },
    note: ''
  }
}

export function buildBotSettingsPayload(form) {
  return {
    isActive: form.isActive,
    formationTendency: form.formationTendency,
    behaviorWeights: {
      ...form.behaviorWeights
    },
    marketSettings: {
      sellCrystals: {
        maxMarketAmount: form.marketSettings.sellCrystals.maxMarketAmount
      },
      sellRuneStones: {
        enabled: form.marketSettings.sellRuneStones.enabled,
        maxAmount: form.marketSettings.sellRuneStones.maxAmount,
        rarities: [...form.marketSettings.sellRuneStones.rarities]
      }
    },
    activeTimeSettings: {
      enabled: form.activeTimeSettings.enabled,
      startHour: form.activeTimeSettings.startHour,
      endHour: form.activeTimeSettings.endHour
    },
    note: form.note
  }
}
