import mongoose from 'mongoose'

/**
 * 矿场 - 10x10 扫雷区域
 * 全游戏共享，每隔10级的迷宫最多产生2个矿场
 */
const gameMineSchema = new mongoose.Schema(
  {
    // 发现者（矿主）
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    ownerGuildName: {
      type: String,
      required: true
    },
    // 矿场等级（发现时的迷宫等级）
    level: {
      type: Number,
      required: true,
      min: 1,
      index: true
    },
    // 等级区间索引（用于限制每10级最多2个矿场）
    // 如 level 1-10 → levelBracket = 1，11-20 → levelBracket = 2
    levelBracket: {
      type: Number,
      required: true,
      index: true
    },
    // 10x10 棋盘
    // 每个格子: { type, revealed, exploredBy, exploredByGuildName, rewardType, challengeDefeated }
    // type: 'number' | 'reward'
    // adjacentRewards: 周围奖励区域数量（仅 number 类型有效）
    grid: {
      type: [[mongoose.Schema.Types.Mixed]],
      required: true
    },
    // 奖励区域总数
    totalRewards: {
      type: Number,
      required: true,
      min: 10,
      max: 30
    },
    // 已探索的奖励区域数
    exploredRewards: {
      type: Number,
      default: 0,
      min: 0
    },
    // 水晶概率（发现矿场时迷宫的概率）
    crystalRates: {
      attackCryRate: { type: Number, default: 2500 },
      defenseCryRate: { type: Number, default: 2500 },
      speedCryRate: { type: Number, default: 2500 },
      SANCryRate: { type: Number, default: 2500 }
    },
    // 矿场是否已废弃（所有奖励区域被探索完）
    depleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
)

gameMineSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameMine = mongoose.model('game_mine', gameMineSchema)
export default gameMine
