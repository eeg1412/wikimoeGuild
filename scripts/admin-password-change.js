#!/usr/bin/env node

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 加载环境变量
dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../server/.env'
  )
})

const mongodbUri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/wikimoe-guild'

// 导入模型
const adminAccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: String,
  password: String,
  role: Number,
  createdAt: Date,
  updatedAt: Date
})

adminAccountSchema.pre('save', function () {
  if (!this.isModified('password')) return
  const salt = bcrypt.genSaltSync(10)
  this.password = bcrypt.hashSync(this.password, salt)
})

const AdminAccount = mongoose.model('admin_accounts', adminAccountSchema)

async function changePassword() {
  const [username, newPassword] = process.argv.slice(2)

  if (!username || !newPassword) {
    console.error(
      '用法: pnpm run admin-password-change <username> <newpassword>'
    )
    console.error('示例: pnpm run admin-password-change admin newPassword123!')
    process.exit(1)
  }

  try {
    await mongoose.connect(mongodbUri)
    console.log('✅ 已连接到数据库\n')

    const admin = await AdminAccount.findOne({ username })

    if (!admin) {
      console.error(`❌ 找不到管理员账户: ${username}`)
      process.exit(1)
    }

    admin.password = newPassword
    await admin.save()

    console.log(`✅ 密码修改成功`)
    console.log(`   账户: ${admin.username}`)
    console.log(`   邮箱: ${admin.email}`)
    console.log(
      `   角色: ${admin.role === 999 ? '👑 超级管理员' : `📌 普通管理员 (role: ${admin.role})`}`
    )
  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

changePassword()
