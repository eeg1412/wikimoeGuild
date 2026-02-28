import mongoose from 'mongoose'

// 素材最大堆叠数量
const MAX_MATERIAL = 9999999
const MATERIAL_FIELDS = [
  'attackCrystal',
  'defenseCrystal',
  'speedCrystal',
  'sanCrystal',
  'runeFragment'
]

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
      max: MAX_MATERIAL,
      default: 0
    },
    // 防御水晶
    defenseCrystal: {
      type: Number,
      min: 0,
      max: MAX_MATERIAL,
      default: 0
    },
    // 速度水晶
    speedCrystal: {
      type: Number,
      min: 0,
      max: MAX_MATERIAL,
      default: 0
    },
    // SAN水晶
    sanCrystal: {
      type: Number,
      min: 0,
      max: MAX_MATERIAL,
      default: 0
    },
    // 符文石碎片
    runeFragment: {
      type: Number,
      min: 0,
      max: MAX_MATERIAL,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

// pre-save 钳制素材数量
gamePlayerInventorySchema.pre('save', function (next) {
  for (const field of MATERIAL_FIELDS) {
    if (this[field] > MAX_MATERIAL) {
      this[field] = MAX_MATERIAL
    }
  }
  next()
})

// $inc 操作后钳制素材数量（使用原生集合操作避免递归触发中间件）
gamePlayerInventorySchema.post(
  ['findOneAndUpdate', 'updateOne'],
  async function () {
    const update = this.getUpdate()
    if (update && update.$inc) {
      const hasPositiveInc = MATERIAL_FIELDS.some(f => update.$inc[f] > 0)
      if (hasPositiveInc) {
        const filter = this.getFilter()
        const clampSet = {}
        for (const f of MATERIAL_FIELDS) {
          if (update.$inc[f] > 0) {
            clampSet[f] = MAX_MATERIAL
          }
        }
        await gamePlayerInventory.collection.updateOne(filter, {
          $min: clampSet
        })
      }
    }
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
