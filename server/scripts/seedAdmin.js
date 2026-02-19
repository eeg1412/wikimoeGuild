import mongoose from 'mongoose'
import config from '../config/index.js'
import User from '../models/User.js'
import { ROLES } from 'shared'

await mongoose.connect(config.mongodbUri)

const existing = await User.findOne({ username: 'admin' })
if (existing) {
  console.log('管理员账号已存在')
} else {
  await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: ROLES.ADMIN
  })
  console.log('管理员账号已创建: admin / admin123')
}

await mongoose.disconnect()
process.exit(0)
