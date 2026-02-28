import mongoose from 'mongoose'

const gamePlayerInventorySchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      unique: true,
      index: true
    },
    // 攻击水晶
    attackCrystal: {
      type: Number,
      min: 0,
      default: 0
    },
    // 防御水晶
    defenseCrystal: {
      type: Number,
      min: 0,
      default: 0
    },
    // 速度水晶
    speedCrystal: {
      type: Number,
      min: 0,
      default: 0
    },
    // SAN水晶
    sanCrystal: {
      type: Number,
      min: 0,
      default: 0
    },
    // 符文石碎片
    runeFragment: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

gamePlayerInventorySchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gamePlayerInventory = mongoose.model(
  'game_player_inventory',
  gamePlayerInventorySchema
)

export default gamePlayerInventory
