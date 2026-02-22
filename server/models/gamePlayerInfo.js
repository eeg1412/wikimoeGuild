import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const gamePlayerInfoSchema = new mongoose.Schema(
  {
    guildName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 8,
      index: true
    },
    hasCustomGuildIcon: {
      type: Boolean,
      default: false
    },
    mapChangeUses: {
      type: Number,
      default: 24
    },
    lastMapRecoverAt: {
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
