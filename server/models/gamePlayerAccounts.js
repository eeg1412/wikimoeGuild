import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const gamePlayerAccountsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      index: true
    }
  },
  {
    timestamps: true
  }
)

// 保存前加密密码
gamePlayerAccountsSchema.pre('save', function () {
  if (!this.isModified('password')) return
  const salt = bcrypt.genSaltSync(10)
  this.password = bcrypt.hashSync(this.password, salt)
})

// 比较密码
gamePlayerAccountsSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password)
}

// 转 JSON 时移除密码
gamePlayerAccountsSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password
    return ret
  }
})

const gamePlayerAccount = mongoose.model(
  'game_player_accounts',
  gamePlayerAccountsSchema
)

export default gamePlayerAccount
