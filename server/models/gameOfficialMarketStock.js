import mongoose from 'mongoose'

/**
 * 官方市场水晶库存
 * 记录的是从玩家手中收购来的水晶数量
 */
const gameOfficialMarketStockSchema = new mongoose.Schema(
  {
    // 使用固定ID 'global' 保证全局唯一
    key: {
      type: String,
      default: 'global',
      unique: true,
      index: true
    },
    attackCrystal: { type: Number, min: 0, default: 0 },
    defenseCrystal: { type: Number, min: 0, default: 0 },
    speedCrystal: { type: Number, min: 0, default: 0 },
    sanCrystal: { type: Number, min: 0, default: 0 },
    runeFragment: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
)

gameOfficialMarketStockSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameOfficialMarketStock = mongoose.model(
  'game_official_market_stock',
  gameOfficialMarketStockSchema
)
export default gameOfficialMarketStock
