export { HTTP_CODE, BIZ_CODE } from './httpCode.js'

/**
 * 战斗系统版本号
 * 每次战斗系统进行修改时需要递增此值
 * 竞技场战斗记录中会存储此版本号，版本不一致时前端不展示回放
 */
export const BATTLE_VERSION = 1

/**
 * 冒险家角色标记映射
 * key 为存储在数据库中的字符串编号，value 为前端展示用的 emoji 和标签
 */
export const ROLE_TAG_MAP = {
  1: { emoji: '⚔️', label: '输出' },
  2: { emoji: '🛡️', label: '坦克' },
  3: { emoji: '🥷', label: '刺客' },
  4: { emoji: '⚖️', label: '平衡' }
}

/**
 * 有效的角色标记值列表（含空字符串用于清除）
 */
export const VALID_ROLE_TAGS = ['', '1', '2', '3', '4']
