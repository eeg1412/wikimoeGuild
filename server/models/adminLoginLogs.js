import mongoose from 'mongoose'

const adminLoginLogSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      maxlength: 30,
      trim: true,
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
      expires: 0,
      default: () => new Date(Date.now() + 370 * 24 * 60 * 60 * 1000), // 370天后过期
      index: true
    }
  },
  { timestamps: true }
)

const AdminLoginLog = mongoose.model('admin_login_logs', adminLoginLogSchema)

export default AdminLoginLog
