import mongoose from 'mongoose'
import config from './index.js'
import { initGlobalConfig } from './globalConfig.js'
import logger from '../utils/logger.js'

export async function connectDB() {
  try {
    const db = mongoose.connection
    db.on('error', error => {
      logger.error('MongoDB connection error:', error)
    })
    db.once('open', async () => {
      await initGlobalConfig()
      global.$DBinited = true
      logger.info('MongoDB connected successfully')
    })
    await mongoose.connect(config.mongodbUri)
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}
