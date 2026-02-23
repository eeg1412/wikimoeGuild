import mongoose from 'mongoose'

const gamePlayerBanLogSchema = new mongoose.Schema(
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
    // 封禁日期
    banExpires: {
      type: Date,
      required: true,
      index: true
    },
    // 操作管理员
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin_accounts',
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

const GamePlayerBanLog = mongoose.model(
  'game_player_ban_logs',
  gamePlayerBanLogSchema
)

export default GamePlayerBanLog
