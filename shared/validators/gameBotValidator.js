import Joi from 'joi'

// 创建机器人
export const createBotSchema = Joi.object({
  formationTendency: Joi.string()
    .valid('aggressive', 'balanced', 'defensive', 'assassin')
    .default('balanced'),
  guildName: Joi.string().min(2).max(20).allow('').optional(),
  initialGold: Joi.number().integer().min(0).max(2000000000).default(0),
  initialCrystals: Joi.object({
    attackCrystal: Joi.number().integer().min(0).max(9999999).default(0),
    defenseCrystal: Joi.number().integer().min(0).max(9999999).default(0),
    speedCrystal: Joi.number().integer().min(0).max(9999999).default(0),
    sanCrystal: Joi.number().integer().min(0).max(9999999).default(0),
    runeFragment: Joi.number().integer().min(0).max(9999999).default(0)
  }).default(),
  iconBase64: Joi.string().optional(),
  note: Joi.string().max(500).allow('').default('')
})

// 更新机器人
// 注：招募冒险家、升级属性、卖水晶已成为共通行动，不再需要对应的行为权重
export const updateBotSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  formationTendency: Joi.string()
    .valid('aggressive', 'balanced', 'defensive', 'assassin')
    .optional(),
  behaviorWeights: Joi.object({
    switchDungeon: Joi.number().integer().min(0).max(100),
    dungeonBattle: Joi.number().integer().min(0).max(100),
    arenaBattle: Joi.number().integer().min(0).max(100),
    mineExplore: Joi.number().integer().min(0).max(100),
    runeStoneManage: Joi.number().integer().min(0).max(100),
    guildUpgrade: Joi.number().integer().min(0).max(100),
    formationManage: Joi.number().integer().min(0).max(100),
    idle: Joi.number().integer().min(0).max(100)
  }).optional(),
  marketSettings: Joi.object({
    sellCrystals: Joi.object({
      // maxMarketAmount: 市场最大挂卖数量。设置后，优先挂单到自由市场，超出部分卖给官方
      // 若为 0 或未设置，则直接卖给官方
      maxMarketAmount: Joi.number().integer().min(0).max(99999)
    }).optional(),
    sellRuneStones: Joi.object({
      enabled: Joi.boolean(),
      maxAmount: Joi.number().integer().min(0).max(100),
      rarities: Joi.array()
        .items(Joi.string().valid('normal', 'rare', 'legendary'))
        .min(0)
        .max(3)
    }).optional()
  }).optional(),
  note: Joi.string().max(500).allow('').optional()
})

// 修改机器人公会名
export const updateBotGuildNameSchema = Joi.object({
  guildName: Joi.string().min(2).max(20).required()
})

// 修改机器人公会图标
export const updateBotGuildIconSchema = Joi.object({
  iconBase64: Joi.string().required()
})

// 修改机器人冒险家名字
export const updateBotAdventurerNameSchema = Joi.object({
  adventurerId: Joi.string().required(),
  name: Joi.string().min(2).max(20).required()
})

// 修改机器人冒险家头像
export const updateBotAdventurerAvatarSchema = Joi.object({
  adventurerId: Joi.string().required(),
  avatarBase64: Joi.string().required()
})
