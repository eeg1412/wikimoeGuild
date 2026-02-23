import mongoose from 'mongoose'

const gamePlayerInfoSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      unique: true,
      index: true
    },
    guildName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 8,
      index: true
    },
    gold: {
      type: Number,
      min: 0,
      max: 2000000000,
      default: 0
    },
    hasCustomGuildIcon: {
      type: Boolean,
      default: false
    },
    mapCanChangeUses: {
      type: Number,
      min: 0,
      default: 24
    },
    lastMapRecoverAt: {
      type: Date,
      default: Date.now
    },
    miningCanUses: {
      type: Number,
      min: 0,
      default: 20
    },
    lastMiningRecoverAt: {
      type: Date,
      default: Date.now
    },
    // 冒险家数量
    adventurerCount: {
      type: Number,
      min: 0,
      default: 0
    },
    dungeonsBackgroundId: {
      type: Number,
      min: 1,
      default: 1
    },
    // 攻击水晶（1），防御水晶（2），速度水晶（3），SAN值水晶（4） 各自的概率 ，总和必须为10000
    dungeonsCryRates: {
      attackCryRate: {
        type: Number,
        min: 0,
        default: 2500,
        max: 10000
      },
      defenseCryRate: {
        type: Number,
        min: 0,
        default: 2500,
        max: 10000
      },
      speedCryRate: {
        type: Number,
        min: 0,
        default: 2500,
        max: 10000
      },
      SANCryRate: {
        type: Number,
        min: 0,
        default: 2500,
        max: 10000
      }
    },
    // 地下迷宫等级
    dungeonsLevel: {
      type: Number,
      min: 1,
      default: 1
    },
    // 上次迷宫结算时间
    lastDungeonSettleAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

gamePlayerInfoSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gamePlayerInfo = mongoose.model('game_player_info', gamePlayerInfoSchema)

export default gamePlayerInfo
