export { HTTP_CODE, BIZ_CODE } from './httpCode.js'

/**
 * 战斗系统版本号
 * 每次战斗系统进行修改时需要递增此值
 * 竞技场战斗记录中会存储此版本号，版本不一致时前端不展示回放
 */
export const BATTLE_VERSION = 1

/**
 * 战斗冷却时间（秒）
 * 玩家每次战斗后需等待该时间才能再次发起战斗
 */
export const BATTLE_COOLDOWN_SECONDS = 3

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

/**
 * 后4排（索引5-24）中使用自由均衡分配的NPC角色数量
 * 数值越大，高难度NPC阵容的整体强度越低
 */
export const NPC_FREE_ALLOC_COUNT = 5

/**
 * 符文石碎片系数默认值
 * 分解: 获得碎片 = 系数 × 等级
 * 升级: 消耗碎片 = 系数 × 当前等级
 * 管理后台可覆盖这些默认值
 */
export const RUNE_STONE_DECOMPOSE_NORMAL_BASE = 1
export const RUNE_STONE_DECOMPOSE_RARE_BASE = 10
export const RUNE_STONE_DECOMPOSE_LEGENDARY_BASE = 50
export const RUNE_STONE_UPGRADE_NORMAL_BASE = 10
export const RUNE_STONE_UPGRADE_RARE_BASE = 100
export const RUNE_STONE_UPGRADE_LEGENDARY_BASE = 500
