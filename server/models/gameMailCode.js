import mongoose from 'mongoose'

const gameMailCodeSchema = new mongoose.Schema(
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
    code: {
      type: String,
      required: true,
      trim: true
    },
    used: {
      type: Boolean,
      default: false,
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
    // 验证码过期时间
    codeExpires: {
      type: Date,
      required: true,
      index: true
    },
    // 用于自动过期删除
    expires: {
      type: Date,
      expires: 0,
      default: () => new Date(Date.now() + 370 * 24 * 60 * 60 * 1000), // 370天后过期
      index: true
    }
  },
  { timestamps: true }
)

const GameMailCode = mongoose.model('game_mail_codes', gameMailCodeSchema)

export default GameMailCode
