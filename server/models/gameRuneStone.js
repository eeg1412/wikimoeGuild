import mongoose from 'mongoose'

const gameRuneStoneSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 稀有度: normal, rare, legendary
    rarity: {
      type: String,
      required: true,
      enum: ['normal', 'rare', 'legendary'],
      index: true
    },
    // 等级
    level: {
      type: Number,
      min: 1,
      max: 9999999,
      default: 1
    },
    // 主动技能列表 (value引用runeStoneActiveSkillDataBase)
    activeSkills: [
      {
        skillId: { type: String, required: true }
      }
    ],
    // 被动增益列表
    passiveBuffs: [
      {
        // 属性类型: attack, defense, speed, san
        buffType: {
          type: String,
          required: true,
          enum: ['attack', 'defense', 'speed', 'san']
        },
        // 增益等级 1-30
        buffLevel: {
          type: Number,
          required: true,
          min: 1,
          max: 30
        }
      }
    ],
    // 是否已装备（关联冒险家ID）
    equippedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_adventurer',
      default: null,
      index: true
    },
    // 是否在市场上架中
    listedOnMarket: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

gameRuneStoneSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameRuneStone = mongoose.model('game_rune_stone', gameRuneStoneSchema)

export default gameRuneStone
