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
      maxlength: 20,
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
    // 自定义公会图标更新时间
    customGuildIconUpdatedAt: {
      type: Date,
      default: null
    },
    // 地图可切换次数
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
      default: 24
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
    // 玩家选择的迷宫等级（用于控制符文石产出等级，默认跟随最高等级）
    selectedDungeonsLevel: {
      type: Number,
      min: 1,
      default: 1
    },
    // 上次迷宫结算时间
    lastDungeonSettleAt: {
      type: Date,
      default: Date.now
    },
    // 上次对战时间（对战冷却用）
    lastBattleAt: {
      type: Date,
      default: null
    },
    // 公会等级（起始为1，最大200000）
    guildLevel: {
      type: Number,
      min: 1,
      max: 200000,
      default: 1
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
