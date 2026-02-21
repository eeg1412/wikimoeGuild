#!/usr/bin/env node

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 加载环境变量
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
})

const mongodbUri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/wikimoe-guild'

// 导入模型
const adminAccountSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: Number,
  createdAt: Date,
  updatedAt: Date
})

const AdminAccount = mongoose.model('admin_accounts', adminAccountSchema)

async function listAdmins() {
  try {
    await mongoose.connect(mongodbUri)
    console.log('✅ 已连接到数据库\n')

    const admins = await AdminAccount.find().sort({ createdAt: -1 })

    if (admins.length === 0) {
      console.log('📭 没有找到任何管理员账户\n')
      return
    }

    console.log(`📋 管理员列表 (共 ${admins.length} 个)\n`)
    console.log('─'.repeat(80))

    admins.forEach((admin, index) => {
      const roleText =
        admin.role === 999
          ? '👑 超级管理员'
          : `📌 普通管理员 (role: ${admin.role})`
      console.log(`${index + 1}. ${admin.username}`)
      console.log(`   邮箱: ${admin.email}`)
      console.log(`   角色: ${roleText}`)
      console.log(
        `   创建时间: ${admin.createdAt?.toLocaleString('zh-CN') || 'N/A'}`
      )
      console.log()
    })

    console.log('─'.repeat(80))
  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

listAdmins()
