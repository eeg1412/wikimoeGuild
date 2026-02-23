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
