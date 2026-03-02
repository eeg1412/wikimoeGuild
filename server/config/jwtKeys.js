import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import logger from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KEYS_DIR = join(__dirname, '..', 'keys')

/**
 * 密钥容器，initJwtKeys() 执行后填充
 */
export const jwtKeys = {
  playerSecret: /** @type {string} */ (null),
  adminSecret: /** @type {string} */ (null),
  cacheSecret: /** @type {string} */ (null)
}

/**
 * 加载或生成指定密钥文件
 * @param {string} filename
 * @returns {string}
 */
function loadOrCreate(filename) {
  const filepath = join(KEYS_DIR, filename)
  if (existsSync(filepath)) {
    const secret = readFileSync(filepath, 'utf-8').trim()
    logger.info(`JWT key loaded: ${filename}`)
    return secret
  }
  // 生成 64 字节（128 位十六进制）强随机密钥
  const secret = randomBytes(64).toString('hex')
  writeFileSync(filepath, secret, { encoding: 'utf-8', mode: 0o600 })
  logger.info(`JWT key generated: ${filename}`)
  return secret
}

/**
 * 初始化 JWT 密钥。
 * 在 app.js 启动时同步调用，早于任何路由注册。
 */
export function initJwtKeys() {
  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true })
  }
  jwtKeys.playerSecret = loadOrCreate('player.key')
  jwtKeys.adminSecret = loadOrCreate('admin.key')
  jwtKeys.cacheSecret = loadOrCreate('cache.key')
}
