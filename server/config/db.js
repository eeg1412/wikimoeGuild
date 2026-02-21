import mongoose from 'mongoose'
import config from './index.js'
import { initGlobalConfig } from './globalConfig.js'
import logger from '../utils/logger.js'

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri)
    const db = mongoose.connection
    db.on('error', error => {
      logger.error('MongoDB connection error:', error)
    })
    db.once('open', () => {
      initGlobalConfig()
      logger.info('MongoDB connected successfully')
    })
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}
