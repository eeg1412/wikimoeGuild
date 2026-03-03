import mongoose from 'mongoose'

/**
 * 自由市场 - 素材交易挂单（卖单 + 求购单）
 */
const gameMarketListingSchema = new mongoose.Schema(
  {
    // 卖家/求购者
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 挂单类型: sell(出售) / buy(求购)
    orderType: {
      type: String,
      required: true,
      enum: ['sell', 'buy'],
      index: true
    },
    // 素材类型
    materialType: {
      type: String,
      required: true,
      enum: [
        'attackCrystal',
        'defenseCrystal',
        'speedCrystal',
        'sanCrystal',
        'runeFragment'
      ],
      index: true
    },
    // 数量
    quantity: {
      type: Number,
      required: true,
      min: 0,
      max: 2000000000
    },
    // 单价（金币）
    unitPrice: {
      type: Number,
      required: true,
      min: 1,
      max: 2000000000
    },
    // 原始数量（记录下单时的数量，用于部分成交计算）
    originalQuantity: {
      type: Number,
      min: 1,
      max: 2000000000
    },
    // 待收取金币（出售订单成交后，金币暂存于此）
    pendingGold: {
      type: Number,
      default: 0,
      min: 0
    },
    // 待收取素材数量（求购订单成交后，素材暂存于此）
    pendingQuantity: {
      type: Number,
      default: 0,
      min: 0
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

gameMarketListingSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameMarketListing = mongoose.model(
  'game_market_listing',
  gameMarketListingSchema
)
export default gameMarketListing
