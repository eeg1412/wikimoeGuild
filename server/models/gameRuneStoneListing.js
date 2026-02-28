import mongoose from 'mongoose'

/**
 * 自由市场 - 符文石交易挂单
 */
const gameRuneStoneListingSchema = new mongoose.Schema(
  {
    // 卖家
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 符文石
    runeStone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_rune_stone',
      required: true,
      index: true
    },
    // 出售价格（金币）
    price: {
      type: Number,
      required: true,
      min: 1,
      max: 2000000000
    },
    // 状态: active(活跃) / completed(已成交) / cancelled(已取消)
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'completed', 'cancelled'],
      index: true
    }
  },
  { timestamps: true }
)

gameRuneStoneListingSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameRuneStoneListing = mongoose.model(
  'game_rune_stone_listing',
  gameRuneStoneListingSchema
)
export default gameRuneStoneListing
