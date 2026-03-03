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
      required: true
    },
    // 攻击偏好，默认1
    attackPreference: {
      type: String,
      required: true,
      default: '1'
    },

    // 默认头像ID 1-10
    defaultAvatarId: {
      type: Number,
      min: 1,
      max: 10,
      default: 1
    },

    // 是否自定义头像
    hasCustomAvatar: {
      type: Boolean,
      default: false
    },
    // 自定义头像更新时间
    customAvatarUpdatedAt: {
      type: Date,
      default: null
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
      max: 9999999,
      default: 1
    },
    // 防御等级
    defenseLevel: {
      type: Number,
      min: 1,
      max: 9999999,
      default: 1
    },
    // 速度等级
    speedLevel: {
      type: Number,
      min: 1,
      max: 9999999,
      default: 1
    },
    // SAN值等级
    SANLevel: {
      type: Number,
      min: 1,
      max: 9999999,
      default: 1
    },
    // 综合等级
    comprehensiveLevel: {
      type: Number,
      min: 1,
      max: 99999999,
      default: 1
    },
    // 装备的符文石
    runeStone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_rune_stone',
      default: null
    },
    // 角色标记编号：'1'=输出 '2'=坦克 '3'=刺客 '4'=平衡，''=无
    roleTag: {
      type: String,
      default: '',
      maxlength: 2
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
