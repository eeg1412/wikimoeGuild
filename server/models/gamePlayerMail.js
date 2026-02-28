import mongoose from 'mongoose'

const gamePlayerMailSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 邮件标题
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    // 邮件内容
    content: {
      type: String,
      default: '',
      maxlength: 2000
    },
    // 类型: system(系统通知), reward(奖励), arena(竞技场), market(市场)
    type: {
      type: String,
      required: true,
      enum: ['system', 'reward', 'arena', 'market'],
      default: 'system'
    },
    // 附件 - 金币
    attachGold: {
      type: Number,
      min: 0,
      default: 0
    },
    // 附件 - 物品
    attachItems: {
      attackCrystal: { type: Number, min: 0, default: 0 },
      defenseCrystal: { type: Number, min: 0, default: 0 },
      speedCrystal: { type: Number, min: 0, default: 0 },
      sanCrystal: { type: Number, min: 0, default: 0 },
      runeFragment: { type: Number, min: 0, default: 0 }
    },
    // 附件 - 符文石ID列表
    attachRuneStones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'game_rune_stone'
      }
    ],
    // 是否已读
    read: {
      type: Boolean,
      default: false
    },
    // 附件是否已领取
    claimed: {
      type: Boolean,
      default: false
    },
    // 是否有附件
    hasAttachment: {
      type: Boolean,
      default: false
    },
    // 30天后自动删除
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 }
    }
  },
  { timestamps: true }
)

gamePlayerMailSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gamePlayerMail = mongoose.model('game_player_mail', gamePlayerMailSchema)
export default gamePlayerMail
