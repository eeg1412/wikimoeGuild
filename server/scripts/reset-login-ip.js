#!/usr/bin/env node
/**
 * 重置指定 IP 在 1 小时内的错误登录记录
 * 使用方式: pnpm run reset-login-ip <IP>
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

async function resetLoginIp() {
  const ip = process.argv[2]
  if (!ip) {
    console.error(
      '❌ 请提供 IP 地址，例如: pnpm run reset-login-ip 192.168.1.1'
    )
    process.exit(1)
  }

  try {
    await mongoose.connect(mongodbUri)
    console.log('✅ 已连接到数据库\n')

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const result = await AdminLoginLog.deleteMany({
      ip,
      success: false,
      createdAt: { $gte: oneHourAgo }
    })

    console.log(`✅ 已删除 IP [${ip}] 在 1 小时内的失败登录记录`)
    console.log(`   共删除 ${result.deletedCount} 条记录`)
    console.log(`   该 IP 现在可以重新尝试登录\n`)
  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

resetLoginIp()
