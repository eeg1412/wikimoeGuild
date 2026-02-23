import mongoose from 'mongoose'

const gameAdventurerSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 元素 地水火风 光明 黑暗 的其中一种
    elements: {
      type: String,
      required: true,
      enum: ['1', '2', '3', '4', '5', '6']
    },
    // 被动增益类型，默认1
    passiveBuffType: {
      type: String,
      required: true,
      enum: ['1', '2', '3', '4', '5', '6']
    },

    // 默认头像ID 1-10
    defaultAvatarId: {
      type: String,
      min: 1,
      max: 10,
      default: 1
    },
    // 是否自定义头像
    hasCustomAvatar: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
      index: true
    },
    // 攻击等级
    attackLevel: {
      type: Number,
      min: 1,
      max: 999999999,
      default: 1
    },
    // 防御等级
    defenseLevel: {
      type: Number,
      min: 1,
      max: 999999999,
      default: 1
    },
    // 速度等级
    speedLevel: {
      type: Number,
      min: 1,
      max: 999999999,
      default: 1
    },
    // SAN值等级
    SANLevel: {
      type: Number,
      min: 1,
      max: 999999999,
      default: 1
    }
  },
  {
    timestamps: true
  }
)

gameAdventurerSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameAdventurer = mongoose.model('game_adventurer', gameAdventurerSchema)

export default gameAdventurer
