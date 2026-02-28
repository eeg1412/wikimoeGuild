import mongoose from 'mongoose'

/**
 * 矿主收益日志
 * 记录矿主从矿场获得的水晶收益
 */
const gameMineRevenueSchema = new mongoose.Schema(
  {
    // 矿主
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 矿场
    mine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_mine',
      required: true,
      index: true
    },
    // 触发收益的玩家
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true
    },
    triggeredByGuildName: String,
    // 获得的水晶类型和数量
    crystalType: {
      type: String,
      enum: ['attackCrystal', 'defenseCrystal', 'speedCrystal', 'sanCrystal'],
      required: true
    },
    crystalAmount: {
      type: Number,
      required: true,
      min: 1
    },
    // 7天后自动删除
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expires: 0 }
    }
  },
  { timestamps: true }
)

gameMineRevenueSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameMineRevenue = mongoose.model(
  'game_mine_revenue',
  gameMineRevenueSchema
)
export default gameMineRevenue
