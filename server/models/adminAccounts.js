import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminAccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      index: true
    },
    role: {
      type: Number,
      default: 0,
      index: true
    },
    tokenVersion: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
)

// 保存前加密密码
adminAccountSchema.pre('save', function () {
  if (!this.isModified('password')) return
  const salt = bcrypt.genSaltSync(10)
  this.password = bcrypt.hashSync(this.password, salt)
})

// 比较密码
adminAccountSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password)
}

// 转 JSON 时移除密码
adminAccountSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password
    return ret
  }
})

const adminAccount = mongoose.model('admin_accounts', adminAccountSchema)

export default adminAccount
