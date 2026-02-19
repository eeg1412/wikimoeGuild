import mongoose from 'mongoose'
import config from './index.js'
import logger from '../utils/logger.js'

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri)
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}
