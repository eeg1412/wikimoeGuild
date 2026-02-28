import mongoose from 'mongoose'

/**
 * 竞技场赛季
 */
const gameArenaSeasonSchema = new mongoose.Schema(
  {
    // 赛季编号
    seasonNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    // 赛季开始时间（0点整）
    startTime: {
      type: Date,
      required: true
    },
    // 赛季结束时间（0点整）
    endTime: {
      type: Date,
      required: true
    },
    // 赛季状态: active(进行中) / settling(结算中) / ended(已结束)
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'settling', 'ended'],
      index: true
    },
    // 奖池金额
    poolAmount: {
      type: Number,
      min: 0,
      default: 100000
    },
    // 参与奖金额
    participationReward: {
      type: Number,
      min: 0,
      default: 500
    },
    // 每次战斗金币
    battleGold: {
      type: Number,
      min: 0,
      default: 50
    },
    // 结算结果
    results: {
      first: {
        account: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'game_player_accounts'
        },
        guildName: String,
        points: Number,
        reward: Number
      },
      second: {
        account: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'game_player_accounts'
        },
        guildName: String,
        points: Number,
        reward: Number
      },
      third: {
        account: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'game_player_accounts'
        },
        guildName: String,
        points: Number,
        reward: Number
      }
    }
  },
  { timestamps: true }
)

gameArenaSeasonSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameArenaSeason = mongoose.model(
  'game_arena_season',
  gameArenaSeasonSchema
)
export default gameArenaSeason
