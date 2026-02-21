#!/usr/bin/env node
/**
 * 重置指定账号在 24 小时内的登录尝试记录
 * 使用方式: pnpm run reset-login-username <账号>
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
})

const mongodbUri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/wikimoe-guild'

const adminLoginLogSchema = new mongoose.Schema(
  {
    username: String,
    ip: String,
    success: Boolean,
    message: String,
    createdAt: Date
  },
  { timestamps: true }
)

const AdminLoginLog = mongoose.model('admin_login_logs', adminLoginLogSchema)

async function resetLoginUsername() {
  const username = process.argv[2]
  if (!username) {
    console.error(
      '❌ 请提供账号名称，例如: pnpm run reset-login-username admin'
    )
    process.exit(1)
  }

  try {
    await mongoose.connect(mongodbUri)
    console.log('✅ 已连接到数据库\n')

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const result = await AdminLoginLog.deleteMany({
      username,
      createdAt: { $gte: oneDayAgo }
    })

    console.log(`✅ 已删除账号 [${username}] 在 24 小时内的登录尝试记录`)
    console.log(`   共删除 ${result.deletedCount} 条记录`)
    console.log(`   该账号现在可以重新尝试登录\n`)
  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

resetLoginUsername()
