import mongoose from 'mongoose'

/**
 * 机器人档案
 * 独立于 gamePlayerAccount，仅此集合标识某个账号是机器人
 * 游戏内的所有查询永远不会 join 此表，确保机器人身份不被暴露
 */
const gameBotProfileSchema = new mongoose.Schema(
  {
    // 关联的真实玩家账号
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      unique: true,
      index: true
    },
    // 是否启用
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    // 阵容倾向: aggressive(攻击), balanced(均衡), defensive(防御), assassin(刺客)
    formationTendency: {
      type: String,
      enum: ['aggressive', 'balanced', 'defensive', 'assassin'],
      default: 'balanced'
    },
    // 冒险家角色分配（自动由阵容管理分配）
    // key = adventurerId, value = 'tank' | 'dps' | 'assassin' | 'balanced'
    adventurerRoles: {
      type: Map,
      of: {
        type: String,
        enum: ['tank', 'dps', 'assassin', 'balanced']
      },
      default: () => new Map()
    },
    // 行为权重 (0-100)，越高越可能执行该行为
    behaviorWeights: {
      recruitAdventurer: { type: Number, min: 0, max: 100, default: 60 },
      levelUpStats: { type: Number, min: 0, max: 100, default: 80 },
      switchDungeon: { type: Number, min: 0, max: 100, default: 40 },
      dungeonBattle: { type: Number, min: 0, max: 100, default: 70 },
      arenaBattle: { type: Number, min: 0, max: 100, default: 60 },
      mineExplore: { type: Number, min: 0, max: 100, default: 50 },
      marketTrade: { type: Number, min: 0, max: 100, default: 40 },
      runeStoneManage: { type: Number, min: 0, max: 100, default: 50 },
      guildUpgrade: { type: Number, min: 0, max: 100, default: 70 },
      formationManage: { type: Number, min: 0, max: 100, default: 60 },
      idle: { type: Number, min: 0, max: 100, default: 20 }
    },
    // 市场交易设置
    marketSettings: {
      // 水晶挂单出售设置
      sellCrystals: {
        enabled: { type: Boolean, default: false },
        // 每种水晶在背包中至少保留多少个
        reserveAmount: { type: Number, min: 0, max: 99999, default: 1000 },
        // 每种水晶同时最多在市场上挂卖多少个
        maxMarketAmount: {
          type: Number,
          min: 0,
          max: 99999,
          default: 1000
        },
        // 兼容旧配置：单值同时表示保留量和市场最大挂卖量
        maxAmount: { type: Number, min: 0, max: 99999 }
      },
      // 符文石挂单出售设置
      sellRuneStones: {
        enabled: { type: Boolean, default: false },
        // 最多同时挂卖多少个符文石
        maxAmount: { type: Number, min: 0, max: 100, default: 3 },
        // 会出售哪些稀有度的符文石
        rarities: {
          type: [String],
          enum: ['normal', 'rare', 'legendary'],
          default: ['legendary']
        }
      }
    },
    // 上次执行行动的时间
    lastTickAt: {
      type: Date,
      default: null
    },
    // 上次执行的行动列表 (用于日志/调试)
    lastActions: [
      {
        action: String,
        detail: String,
        timestamp: Date
      }
    ],
    // 累计行动次数
    totalActions: {
      type: Number,
      default: 0,
      min: 0
    },
    // 管理员备注
    note: {
      type: String,
      default: '',
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
)

gameBotProfileSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameBotProfile = mongoose.model('game_bot_profile', gameBotProfileSchema)

export default gameBotProfile
