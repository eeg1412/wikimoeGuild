import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from 'shared'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    }
  },
  {
    timestamps: true
  }
)

// 保存前加密密码
userSchema.pre('save', function () {
  if (!this.isModified('password')) return
  const salt = bcrypt.genSaltSync(10)
  this.password = bcrypt.hashSync(this.password, salt)
})

// 比较密码
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// 转 JSON 时移除密码
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password
    delete ret.__v
    return ret
  }
})

const User = mongoose.model('User', userSchema)

export default User
