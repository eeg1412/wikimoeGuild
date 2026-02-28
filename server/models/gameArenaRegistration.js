import mongoose from 'mongoose'

/**
 * 竞技场报名（赛季内玩家信息）
 */
const gameArenaRegistrationSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_arena_season',
      required: true,
      index: true
    },
    // 竞技点，初始500
    points: {
      type: Number,
      default: 500
    },
    // 锁定的阵容 - 包含冒险家快照（报名时的阵容grid，存冒险家ID）
    formationGrid: {
      type: [
        [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'game_adventurer',
            default: null
          }
        ]
      ],
      default: () => Array.from({ length: 5 }, () => Array(5).fill(null))
    },
    // 锁定的冒险家ID列表
    lockedAdventurers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'game_adventurer'
      }
    ],
    // 剩余挑战次数
    challengeUses: {
      type: Number,
      min: 0,
      default: 24
    },
    // 上次恢复挑战次数的时间
    lastChallengeRecoverAt: {
      type: Date,
      default: Date.now
    },
    // 主动战斗次数（用于判断参与奖）
    totalBattleCount: {
      type: Number,
      min: 0,
      default: 0
    },
    // 公会名（冗余，方便排行和匹配显示）
    guildName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

// 确保一个玩家每赛季只能报名一次
gameArenaRegistrationSchema.index({ account: 1, season: 1 }, { unique: true })

gameArenaRegistrationSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameArenaRegistration = mongoose.model(
  'game_arena_registration',
  gameArenaRegistrationSchema
)
export default gameArenaRegistration
