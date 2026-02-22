import mongoose from 'mongoose'

const gamePlayerLoginLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
      lowercase: true,
      index: true
    },
    ip: {
      type: String,
      trim: true,
      index: true
    },
    ipInfo: {
      type: Object,
      default: {}
    },
    deviceInfo: {
      type: Object,
      default: {}
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true
    },
    success: {
      type: Boolean,
      default: false,
      index: true
    },
    message: {
      type: String,
      trim: true
    },
    expires: {
      type: Date,
      expires: 31968000,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
)

const GamePlayerLoginLog = mongoose.model(
  'game_player_login_logs',
  gamePlayerLoginLogSchema
)

export default GamePlayerLoginLog
