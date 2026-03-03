/**
 * 公会等级相关共享工具函数
 * 前后端共用，确保计算逻辑一致
 */

/**
 * 获取公会等级所能容纳的最大冒险家数量
 * 1级 = 5，每升1级 +5，最多50
 * @param {number} guildLevel
 * @returns {number}
 */
export function getMaxAdventurerCount(guildLevel) {
  return Math.min(guildLevel * 5, 50)
}

/**
 * 获取公会等级对应的冒险家综合等级上限
 * 1级公会 = 综合等级上限10，每升1级 +10
 * @param {number} guildLevel
 * @returns {number}
 */
export function getMaxComprehensiveLevel(guildLevel) {
  return guildLevel * 10
}

/**
 * 计算公会升级手续费
 * 手续费 = floor(基数 × (1 + 0.5 × (公会等级 − 1)))
 * @param {number} guildLevel - 当前公会等级
 * @param {number} feeBase - 手续费基数（默认1000）
 * @returns {number}
 */
export function getGuildLevelUpFee(guildLevel, feeBase = 1000) {
  return Math.floor(feeBase * (1 + 0.5 * (guildLevel - 1)))
}

/**
 * 获取升级公会所需的满级冒险家数量
 * 1级升2级需要5个，2级升3级需要10个，...5级升6级需要25个
 * 5级之后只需要25个满级冒险家
 * @param {number} guildLevel - 当前公会等级
 * @returns {number}
 */
export function getRequiredMaxLevelAdventurerCount(guildLevel) {
  return Math.min(guildLevel * 5, 25)
}

/**
 * 计算冒险家属性升级所需水晶数量
 * Math.floor(基数 × (1 + 0.5 × (冒险家等级 - 1) / 100))
 * @param {number} adventurerLevel - 当前属性等级
 * @param {number} crystalBase - 升级素材基数（默认100）
 * @returns {number}
 */
export function getAdventurerLevelUpCrystalCost(
  adventurerLevel,
  crystalBase = 100
) {
  return Math.floor(crystalBase * (1 + (0.5 * (adventurerLevel - 1)) / 100))
}

/**
 * 计算冒险家属性升级所需金币
 * Math.floor(基数 × (1 + 0.5 × (冒险家等级 - 1) / 100))
 * @param {number} adventurerLevel - 当前属性等级
 * @param {number} goldBase - 升级金币基数（默认500）
 * @returns {number}
 */
export function getAdventurerLevelUpGoldCost(adventurerLevel, goldBase = 500) {
  return Math.floor(goldBase * (1 + (0.5 * (adventurerLevel - 1)) / 100))
}

/**
 * 计算迷宫等级产出增益（百分比）
 * Math.floor(基数 × (1 + 0.5 × (迷宫等级 - 1) / 100))
 * @param {number} dungeonLevel - 迷宫等级
 * @param {number} bonusBase - 基数（默认100）
 * @returns {number} 百分比值，如 101 表示 101%
 */
export function getDungeonLevelBonus(dungeonLevel, bonusBase = 100) {
  return Math.floor(bonusBase * (1 + (0.5 * (dungeonLevel - 1)) / 100))
}

/**
 * 计算迷宫等级产出增益的公会等级上限
 * 不能超过 Math.floor(基数 × (1 + 0.5 × (公会等级 + 19) / 100))
 * @param {number} guildLevel - 公会等级
 * @param {number} bonusBase - 基数（默认100）
 * @returns {number}
 */
export function getDungeonLevelBonusCap(guildLevel, bonusBase = 100) {
  return Math.floor(bonusBase * (1 + (0.5 * (guildLevel + 19)) / 100))
}

/**
 * 计算水晶产出率上限（与公会等级最大容纳冒险家数挂钩）
 * 最大值 = 最大容纳数 × 110%，但不超过2750%
 * @param {number} guildLevel - 公会等级
 * @returns {number}
 */
export function getCrystalProductionRateCap(guildLevel) {
  const maxAdv = getMaxAdventurerCount(guildLevel)
  // maxAdv × 100% + (maxAdv - 1) × 10% 的上限，但简化为 maxAdv * 110%
  const cap = maxAdv * 100 + (maxAdv - 1) * 10
  return Math.min(cap, 2750)
}
