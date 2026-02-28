import winston from 'winston'
import 'winston-daily-rotate-file'
import config from '../config/index.js'

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
      : `${timestamp} [${level.toUpperCase()}]: ${message}`
  })
)

/**
 * 系统级日志：代码错误、运行时异常等
 * → logs/error.log (error级) + logs/combined.log (全级)
 */
const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return stack
            ? `${timestamp} ${level}: ${message}\n${stack}`
            : `${timestamp} ${level}: ${message}`
        })
      )
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m'
    })
  ]
})

/**
 * 运营级日志：外部服务故障、邮件发送失败、第三方 API 异常等
 * 非代码 Bug 导致的运行时错误，与系统错误日志分开存储，方便运维排查
 * → logs/operational.log
 */
const operationalLogger = winston.createLogger({
  level: 'error',
  format: logFormat,
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/operational-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m'
    })
  ]
})

export { operationalLogger }
export default logger
