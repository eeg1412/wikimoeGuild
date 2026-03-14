import GameAdventurer from '../../models/gameAdventurer.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import {
  executeInLock,
  generateRandomAdventurerAvatarId,
  generateRandomAdventurerName
} from '../../utils/utils.js'
import { saveBase64Image } from '../../utils/imageUpload.js'
import {
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import {
  getMaxAdventurerCount,
  getMaxComprehensiveLevel,
  getAdventurerLevelUpCrystalCost,
  getAdventurerLevelUpGoldCost
} from 'shared/utils/guildLevelUtils.js'

/**
 * 冒险家洗属性（元素/被动增益/攻击偏好）
 */
export async function rerollAttribute(accountId, adventurerId, rerollType) {
  const priceKeyMap = {
    element: 'adventurerRerollElementPrice',
    passiveBuff: 'adventurerRerollPassiveBuffPrice',
    attackPreference: 'adventurerRerollAttackPreferencePrice'
  }

  return await executeInLock(`reroll:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const priceKey = priceKeyMap[rerollType]
    const price = gameSettings[priceKey] ?? 1000

    if (playerInfo.gold < price) {
      const err = new Error(`金币不足，需要 ${price} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    playerInfo.gold -= price
    await playerInfo.save()

    // 随机新属性
    if (rerollType === 'element') {
      const ELEMENTS = ['1', '2', '3', '4', '5', '6']
      let newElement
      do {
        newElement = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]
      } while (newElement === adventurer.elements && ELEMENTS.length > 1)
      adventurer.elements = newElement
    } else if (rerollType === 'passiveBuff') {
      const allBuffTypes = passiveBuffTypeDataBase()
      let newBuff
      do {
        newBuff = allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)]
      } while (
        newBuff.value === adventurer.passiveBuffType &&
        allBuffTypes.length > 1
      )
      adventurer.passiveBuffType = newBuff.value
    } else if (rerollType === 'attackPreference') {
      const allPreferences = attackPreferenceDataBase()
      let newPref
      do {
        newPref =
          allPreferences[Math.floor(Math.random() * allPreferences.length)]
      } while (
        newPref.value === adventurer.attackPreference &&
        allPreferences.length > 1
      )
      adventurer.attackPreference = newPref.value
    }

    await adventurer.save()

    return await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()
  })
}

/**
 * 获取当前玩家的冒险家列表
 */
export async function listMyAdventurers(accountId) {
  const adventurers = await GameAdventurer.find({ account: accountId })
    .select('-account')
    .populate('runeStone')
    .sort({ createdAt: 1 })
    .lean()
  return adventurers
}

/**
 * 获取冒险家详情
 */
export async function getAdventurerDetail(accountId, adventurerId) {
  const adventurer = await GameAdventurer.findOne({
    _id: adventurerId,
    account: accountId
  })
    .select('-account')
    .populate('runeStone')
    .lean()
  if (!adventurer) {
    const err = new Error('冒险家不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return adventurer
}

/**
 * 招募冒险家
 */
export async function recruitAdventurer(accountId) {
  return await executeInLock(`recruit:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    // 检查冒险家数量限制（与公会等级挂钩）
    const maxAdventurers = getMaxAdventurerCount(playerInfo.guildLevel || 1)
    if (playerInfo.adventurerCount >= maxAdventurers) {
      const err = new Error(
        `当前公会等级最多可招募 ${maxAdventurers} 名冒险家，请先升级公会`
      )
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 获取招募价格
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const recruitPrice = gameSettings.adventurerRecruitPrice ?? 10000

    // 检查金币
    if (playerInfo.gold < recruitPrice) {
      const err = new Error(`金币不足，需要 ${recruitPrice} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    playerInfo.gold -= recruitPrice

    // 随机属性
    const ELEMENTS = ['1', '2', '3', '4', '5', '6']
    const randomElement = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]

    // 随机被动增益类型
    const allBuffTypes = passiveBuffTypeDataBase()
    const randomPassiveBuff =
      allBuffTypes[Math.floor(Math.random() * allBuffTypes.length)]

    // 随机攻击偏好
    const allPreferences = attackPreferenceDataBase()
    const randomPreference =
      allPreferences[Math.floor(Math.random() * allPreferences.length)]

    const adventurer = await GameAdventurer.create({
      account: accountId,
      elements: randomElement,
      passiveBuffType: randomPassiveBuff.value,
      attackPreference: randomPreference.value,
      defaultAvatarId: generateRandomAdventurerAvatarId(),
      name: generateRandomAdventurerName(),
      comprehensiveLevel: 1 // 综合等级 = 升级次数 + 1，初始为1
    })

    // 冒险家计数 +1
    playerInfo.adventurerCount += 1
    await playerInfo.save()

    return adventurer
  })
}

/**
 * 冒险家自定义头像（消耗金币）
 */
export async function customizeAvatar(accountId, adventurerId, avatarBase64) {
  return await executeInLock(`avatar:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const avatarPrice = gameSettings.adventurerCustomAvatarPrice ?? 5000

    if (playerInfo.gold < avatarPrice) {
      const err = new Error(`金币不足，需要 ${avatarPrice} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 保存头像图片（base64 -> webp）
    const fileName = `${adventurerId}.webp`
    await saveBase64Image(avatarBase64, 'custom-adventurer-avatar', fileName)

    // 扣除金币
    playerInfo.gold -= avatarPrice
    await playerInfo.save()

    // 更新冒险家
    adventurer.hasCustomAvatar = true
    adventurer.customAvatarUpdatedAt = new Date()
    await adventurer.save()

    return await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()
  })
}

/**
 * 冒险家自定义名字（消耗金币）
 */
export async function customizeName(accountId, adventurerId, newName) {
  return await executeInLock(`name:${accountId}`, async () => {
    // 敏感词过滤
    if (global.$sensitiveFilter && global.$sensitiveFilter.contains(newName)) {
      const err = new Error('名字包含违禁词')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const namePrice = gameSettings.adventurerCustomNamePrice ?? 1000

    if (playerInfo.gold < namePrice) {
      const err = new Error(`金币不足，需要 ${namePrice} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    playerInfo.gold -= namePrice
    await playerInfo.save()

    // 更新名字
    adventurer.name = newName
    await adventurer.save()

    return await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()
  })
}

/**
 * 冒险家属性升级
 * @param {string} statType - attack, defense, speed, san
 * @param {number} times - 升级次数（1/5/10）
 */
export async function levelUpStat(
  accountId,
  adventurerId,
  statType,
  times = 1
) {
  const statMap = {
    attack: { crystal: 'attackCrystal', level: 'attackLevel' },
    defense: { crystal: 'defenseCrystal', level: 'defenseLevel' },
    speed: { crystal: 'speedCrystal', level: 'speedLevel' },
    san: { crystal: 'sanCrystal', level: 'SANLevel' }
  }

  const stat = statMap[statType]
  if (!stat) {
    const err = new Error('无效的属性类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const actualTimes = Math.min(Math.max(1, parseInt(times) || 1), 10)

  return await executeInLock(`levelup:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory) {
      const err = new Error('背包信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const maxCompLevel = getMaxComprehensiveLevel(playerInfo.guildLevel || 1)
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const crystalBase = gameSettings.adventurerLevelUpCrystalBase ?? 100
    const goldBase = gameSettings.adventurerLevelUpGoldBase ?? 500

    let totalCrystalCost = 0
    let totalGoldCost = 0
    let levelsUpgraded = 0

    // 模拟升级，累计消耗，遇到资源不足或等级上限则停止
    for (let i = 0; i < actualTimes; i++) {
      const currentCompLevel =
        adventurer.attackLevel +
        adventurer.defenseLevel +
        adventurer.speedLevel +
        adventurer.SANLevel -
        3

      if (currentCompLevel >= maxCompLevel) {
        if (i === 0) {
          const err = new Error(
            `综合等级已达公会等级上限 ${maxCompLevel}，请先升级公会`
          )
          err.statusCode = 400
          err.expose = true
          throw err
        }
        break
      }

      const currentStatLevel = adventurer[stat.level]
      const crystalCost = getAdventurerLevelUpCrystalCost(
        currentStatLevel,
        crystalBase
      )
      const goldCost = getAdventurerLevelUpGoldCost(currentStatLevel, goldBase)

      if (playerInfo.gold - totalGoldCost < goldCost) {
        if (i === 0) {
          const err = new Error(`金币不足，需要 ${goldCost} 金币`)
          err.statusCode = 400
          err.expose = true
          throw err
        }
        break
      }

      if ((inventory[stat.crystal] || 0) - totalCrystalCost < crystalCost) {
        if (i === 0) {
          const err = new Error(`水晶不足，需要 ${crystalCost} 个`)
          err.statusCode = 400
          err.expose = true
          throw err
        }
        break
      }

      totalCrystalCost += crystalCost
      totalGoldCost += goldCost
      adventurer[stat.level] += 1
      levelsUpgraded++
    }

    // 统一重新计算综合等级
    adventurer.comprehensiveLevel =
      adventurer.attackLevel +
      adventurer.defenseLevel +
      adventurer.speedLevel +
      adventurer.SANLevel -
      3

    // 统一扣除
    playerInfo.gold -= totalGoldCost
    await playerInfo.save()

    await GamePlayerInventory.updateOne(
      { account: accountId },
      { $inc: { [stat.crystal]: -totalCrystalCost } }
    )

    await adventurer.save()

    const updatedAdventurer = await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()

    return { adventurer: updatedAdventurer, levelsUpgraded }
  })
}

/** * 冒险家属性降级
 * @param {string} statType - attack, defense, speed, san
 * @param {number} times - 降级次数（1/5/10）
 */
export async function levelDownStat(
  accountId,
  adventurerId,
  statType,
  times = 1
) {
  const statMap = {
    attack: { level: 'attackLevel' },
    defense: { level: 'defenseLevel' },
    speed: { level: 'speedLevel' },
    san: { level: 'SANLevel' }
  }

  const stat = statMap[statType]
  if (!stat) {
    const err = new Error('无效的属性类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const actualTimes = Math.min(Math.max(1, parseInt(times) || 1), 10)

  return await executeInLock(`leveldown:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const currentStatLevel = adventurer[stat.level]
    if (currentStatLevel <= 1) {
      const err = new Error('属性等级已经是最低了')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 实际最多能降多少级
    const dropLevels = Math.min(currentStatLevel - 1, actualTimes)

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const pricePerLevel = gameSettings.adventurerLevelDownGoldPrice ?? 1000
    const totalGoldCost = dropLevels * pricePerLevel

    if (playerInfo.gold < totalGoldCost) {
      const err = new Error(`金币不足，需要 ${totalGoldCost} 金币`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币，降低等级
    playerInfo.gold -= totalGoldCost
    adventurer[stat.level] -= dropLevels
    adventurer.comprehensiveLevel -= dropLevels

    await playerInfo.save()
    await adventurer.save()

    const updatedAdventurer = await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()

    return {
      adventurer: updatedAdventurer,
      levelsDropped: dropLevels,
      goldCost: totalGoldCost
    }
  })
}

/** * 装备符文石
 */
export async function equipRuneStone(accountId, adventurerId, runeStoneId) {
  return await executeInLock(`equip:${accountId}`, async () => {
    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const runeStone = await GameRuneStone.findOne({
      _id: runeStoneId,
      account: accountId
    })
    if (!runeStone) {
      const err = new Error('符文石不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    // 符文石等级必须 <= 冒险家综合等级
    if (runeStone.level > adventurer.comprehensiveLevel) {
      const err = new Error(
        `符文石等级(${runeStone.level})不能超过冒险家综合等级(${adventurer.comprehensiveLevel})`
      )
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 如果符文石已被其他冒险家装备，先卸下
    if (runeStone.equippedBy) {
      await GameAdventurer.updateOne(
        { _id: runeStone.equippedBy },
        { runeStone: null }
      )
    }

    // 如果冒险家已装备其他符文石，先卸下
    if (adventurer.runeStone) {
      await GameRuneStone.updateOne(
        { _id: adventurer.runeStone },
        { equippedBy: null }
      )
    }

    // 装备
    adventurer.runeStone = runeStoneId
    await adventurer.save()

    runeStone.equippedBy = adventurerId
    await runeStone.save()

    return await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()
  })
}

/**
 * 卸下符文石
 */
export async function unequipRuneStone(accountId, adventurerId) {
  return await executeInLock(`equip:${accountId}`, async () => {
    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (!adventurer.runeStone) {
      const err = new Error('冒险家未装备符文石')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 卸下符文石
    await GameRuneStone.updateOne(
      { _id: adventurer.runeStone },
      { equippedBy: null }
    )

    adventurer.runeStone = null
    await adventurer.save()

    return await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()
  })
}

/**
 * 设置冒险家角色标记
 */
export async function setRoleTag(accountId, adventurerId, roleTag) {
  const adventurer = await GameAdventurer.findOne({
    _id: adventurerId,
    account: accountId
  })
  if (!adventurer) {
    const err = new Error('冒险家不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  adventurer.roleTag = roleTag
  await adventurer.save()

  return await GameAdventurer.findById(adventurer._id)
    .select('-account')
    .populate('runeStone')
    .lean()
}

/**
 * 批量装备最高级符文石
 * 为勾选的冒险家自动匹配并装备等级最高的未装备符文石
 */
export async function batchEquipBestRuneStones(accountId, adventurerIds) {
  return await executeInLock(`batchEquip:${accountId}`, async () => {
    // 获取所有目标冒险家，按综合等级降序（高等级优先获得更好的符文石）
    const adventurers = await GameAdventurer.find({
      _id: { $in: adventurerIds },
      account: accountId
    }).sort({ comprehensiveLevel: -1 })

    if (adventurers.length === 0) {
      const err = new Error('未找到指定冒险家')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    // 第一步：将所有目标冒险家已装备的符文石全部卸下，归还到可用池
    const equippedRuneStoneIds = adventurers
      .filter(adv => adv.runeStone)
      .map(adv => adv.runeStone)

    if (equippedRuneStoneIds.length > 0) {
      await GameRuneStone.updateMany(
        { _id: { $in: equippedRuneStoneIds } },
        { $set: { equippedBy: null } }
      )
      await GameAdventurer.updateMany(
        { _id: { $in: adventurers.map(a => a._id) } },
        { $set: { runeStone: null } }
      )
      // 同步更新内存数据
      for (const adv of adventurers) {
        adv.runeStone = null
      }
    }

    // 第二步：获取所有可用符文石（包含刚卸下的），计算综合评分
    // 评分公式：等级 × 稀有度权重
    // 稀有度权重参考品质系数比例：普通(0.0012) : 稀有(0.0022) : 传说(0.0033) ≈ 1 : 2 : 3
    const RARITY_WEIGHT = {
      legendary: 3,
      rare: 2,
      normal: 1
    }

    const availableRuneStones = await GameRuneStone.find({
      account: accountId,
      equippedBy: null,
      listedOnMarket: { $ne: true }
    })

    // 按综合评分降序排列，评分相同时优先选等级更高的
    const scoredRuneStones = availableRuneStones
      .map(rs => ({
        runeStone: rs,
        score: rs.level * (RARITY_WEIGHT[rs.rarity] ?? 1),
        used: false
      }))
      .sort(
        (a, b) => b.score - a.score || b.runeStone.level - a.runeStone.level
      )

    const results = []
    const usedRuneStoneIds = []
    const adventurerUpdates = []
    const runeStoneUpdates = []

    // 第三步：冒险家按综合等级从高到低，依次匹配评分最高且满足等级约束的符文石
    for (const adv of adventurers) {
      const bestEntryIdx = scoredRuneStones.findIndex(
        entry => !entry.used && entry.runeStone.level <= adv.comprehensiveLevel
      )

      if (bestEntryIdx === -1) {
        results.push({
          adventurerId: adv._id,
          adventurerName: adv.name,
          success: false,
          reason: '无可用符文石'
        })
        continue
      }

      const bestEntry = scoredRuneStones[bestEntryIdx]
      const { runeStone: bestRs } = bestEntry

      adventurerUpdates.push({
        updateOne: {
          filter: { _id: adv._id },
          update: { $set: { runeStone: bestRs._id } }
        }
      })

      runeStoneUpdates.push({
        updateOne: {
          filter: { _id: bestRs._id },
          update: { $set: { equippedBy: adv._id } }
        }
      })

      bestEntry.used = true

      results.push({
        adventurerId: adv._id,
        adventurerName: adv.name,
        success: true,
        runeStoneLevel: bestRs.level,
        runeStoneRarity: bestRs.rarity
      })
    }

    if (adventurerUpdates.length > 0) {
      await Promise.all([
        GameAdventurer.bulkWrite(adventurerUpdates),
        GameRuneStone.bulkWrite(runeStoneUpdates)
      ])
    }

    return results
  })
}

/**
 * 保存属性自动分配比例
 */
export async function saveDistributeRatio(accountId, adventurerId, ratio) {
  const adventurer = await GameAdventurer.findOne({
    _id: adventurerId,
    account: accountId
  })
  if (!adventurer) {
    const err = new Error('冒险家不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  const total = ratio.attack + ratio.defense + ratio.speed + ratio.san
  if (total !== 100) {
    const err = new Error('四项比例之和必须为 100')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  adventurer.statDistributeRatio = ratio
  await adventurer.save()

  return await GameAdventurer.findById(adventurer._id)
    .select('-account')
    .populate('runeStone')
    .lean()
}

/**
 * 自动分配升级（按比例分配等级点）
 * @param {number} totalLevels - 总共要分配的等级数
 */
export async function autoDistributeLevelUp(
  accountId,
  adventurerId,
  totalLevels
) {
  return await executeInLock(`levelup:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const adventurer = await GameAdventurer.findOne({
      _id: adventurerId,
      account: accountId
    })
    if (!adventurer) {
      const err = new Error('冒险家不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory) {
      const err = new Error('背包信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const ratio = adventurer.statDistributeRatio
    if (
      !ratio ||
      ratio.attack + ratio.defense + ratio.speed + ratio.san !== 100
    ) {
      const err = new Error('请先设置属性分配比例（四项之和必须为100%）')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const maxCompLevel = getMaxComprehensiveLevel(playerInfo.guildLevel || 1)
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const crystalBase = gameSettings.adventurerLevelUpCrystalBase ?? 100
    const goldBase = gameSettings.adventurerLevelUpGoldBase ?? 500

    // 按比例计算每种属性分配多少级，san 取剩余保证总数精确
    // round 最多使三项之和超出 1，此时 san=-1，从分配最多的属性减 1 修正
    const statAlloc = {
      attack: Math.round((totalLevels * ratio.attack) / 100),
      defense: Math.round((totalLevels * ratio.defense) / 100),
      speed: Math.round((totalLevels * ratio.speed) / 100),
      san: 0
    }
    statAlloc.san =
      totalLevels - statAlloc.attack - statAlloc.defense - statAlloc.speed
    if (statAlloc.san < 0) {
      const maxKey = ['attack', 'defense', 'speed'].reduce((a, b) =>
        statAlloc[a] >= statAlloc[b] ? a : b
      )
      statAlloc[maxKey] -= 1
      statAlloc.san = 0
    }

    const statMap = {
      attack: { crystal: 'attackCrystal', level: 'attackLevel' },
      defense: { crystal: 'defenseCrystal', level: 'defenseLevel' },
      speed: { crystal: 'speedCrystal', level: 'speedLevel' },
      san: { crystal: 'sanCrystal', level: 'SANLevel' }
    }

    // 事前检查综合等级空间
    const currentCompLevel =
      adventurer.attackLevel +
      adventurer.defenseLevel +
      adventurer.speedLevel +
      adventurer.SANLevel -
      3
    const remainingCapacity = maxCompLevel - currentCompLevel
    if (remainingCapacity <= 0) {
      const err = new Error(
        `综合等级已达公会等级上限 ${maxCompLevel}，请先升级公会`
      )
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 限制总升级数不超过剩余容量
    const effectiveTotalLevels = Math.min(totalLevels, remainingCapacity)
    if (effectiveTotalLevels < totalLevels) {
      statAlloc.attack = Math.round((effectiveTotalLevels * ratio.attack) / 100)
      statAlloc.defense = Math.round(
        (effectiveTotalLevels * ratio.defense) / 100
      )
      statAlloc.speed = Math.round((effectiveTotalLevels * ratio.speed) / 100)
      statAlloc.san =
        effectiveTotalLevels -
        statAlloc.attack -
        statAlloc.defense -
        statAlloc.speed
      if (statAlloc.san < 0) {
        const maxKey = ['attack', 'defense', 'speed'].reduce((a, b) =>
          statAlloc[a] >= statAlloc[b] ? a : b
        )
        statAlloc[maxKey] -= 1
        statAlloc.san = 0
      }
    }

    // 事前检查所有消耗
    let totalGoldNeeded = 0
    const crystalNeeded = {
      attackCrystal: 0,
      defenseCrystal: 0,
      speedCrystal: 0,
      sanCrystal: 0
    }
    const reasons = []

    for (const [statType, allocCount] of Object.entries(statAlloc)) {
      if (allocCount <= 0) continue
      const stat = statMap[statType]
      let currentLevel = adventurer[stat.level]
      for (let i = 0; i < allocCount; i++) {
        const crystalCost = getAdventurerLevelUpCrystalCost(
          currentLevel,
          crystalBase
        )
        const goldCost = getAdventurerLevelUpGoldCost(currentLevel, goldBase)
        crystalNeeded[stat.crystal] += crystalCost
        totalGoldNeeded += goldCost
        currentLevel++
      }
    }

    // 检查金币
    if (playerInfo.gold < totalGoldNeeded) {
      reasons.push(
        `金币不足：需要 ${totalGoldNeeded} 金币，当前 ${playerInfo.gold} 金币`
      )
    }

    // 检查水晶
    for (const [crystalType, needed] of Object.entries(crystalNeeded)) {
      if (needed > 0 && (inventory[crystalType] || 0) < needed) {
        const crystalName = {
          attackCrystal: '攻击',
          defenseCrystal: '防御',
          speedCrystal: '速度',
          sanCrystal: 'SAN'
        }[crystalType]
        reasons.push(
          `${crystalName}水晶不足：需要 ${needed}，当前 ${inventory[crystalType] || 0}`
        )
      }
    }

    if (reasons.length > 0) {
      const err = new Error(reasons.join('；'))
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 执行升级
    let actualLevelsUpgraded = 0
    for (const [statType, allocCount] of Object.entries(statAlloc)) {
      if (allocCount <= 0) continue
      const stat = statMap[statType]
      for (let i = 0; i < allocCount; i++) {
        const crystalCost = getAdventurerLevelUpCrystalCost(
          adventurer[stat.level],
          crystalBase
        )
        const goldCost = getAdventurerLevelUpGoldCost(
          adventurer[stat.level],
          goldBase
        )
        playerInfo.gold -= goldCost
        inventory[stat.crystal] -= crystalCost
        adventurer[stat.level] += 1
        actualLevelsUpgraded++
      }
    }

    // 重算综合等级
    adventurer.comprehensiveLevel =
      adventurer.attackLevel +
      adventurer.defenseLevel +
      adventurer.speedLevel +
      adventurer.SANLevel -
      3

    await playerInfo.save()
    await inventory.save()
    await adventurer.save()

    const updatedAdventurer = await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()

    return {
      adventurer: updatedAdventurer,
      levelsUpgraded: actualLevelsUpgraded,
      allocation: statAlloc
    }
  })
}

/**
 * 批量按比例升降级
 * @param {string} accountId
 * @param {Array<{adventurerId: string, direction: 'up'|'down', totalLevels: number}>} operations
 */
export async function batchRatioDistribute(accountId, operations) {
  return await executeInLock(`batchRatio:${accountId}`, async () => {
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo) {
      const err = new Error('玩家信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory) {
      const err = new Error('背包信息不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const crystalBase = gameSettings.adventurerLevelUpCrystalBase ?? 100
    const goldBase = gameSettings.adventurerLevelUpGoldBase ?? 500
    const downPricePerLevel = gameSettings.adventurerLevelDownGoldPrice ?? 1000
    const maxCompLevel = getMaxComprehensiveLevel(playerInfo.guildLevel || 1)

    const statMap = {
      attack: { crystal: 'attackCrystal', level: 'attackLevel' },
      defense: { crystal: 'defenseCrystal', level: 'defenseLevel' },
      speed: { crystal: 'speedCrystal', level: 'speedLevel' },
      san: { crystal: 'sanCrystal', level: 'SANLevel' }
    }

    // 收集所有冒险家 ID
    const advIds = operations.map(op => op.adventurerId)
    const adventurers = await GameAdventurer.find({
      _id: { $in: advIds },
      account: accountId
    })
    const advMap = new Map()
    for (const adv of adventurers) {
      advMap.set(adv._id.toString(), adv)
    }

    // 第 1 阶段：预计算，跳过不可操作的冒险家
    const opPlans = [] // 可操作的计划
    const skippedResults = [] // 被跳过的结果

    for (const op of operations) {
      const adv = advMap.get(op.adventurerId)
      if (!adv) {
        skippedResults.push({
          adventurerId: op.adventurerId,
          adventurerName: '未知',
          skipped: true,
          skipReason: '冒险家不存在'
        })
        continue
      }

      const ratio = adv.statDistributeRatio
      const ratioTotal = ratio
        ? ratio.attack + ratio.defense + ratio.speed + ratio.san
        : 0
      if (ratioTotal !== 100) {
        skippedResults.push({
          adventurerId: adv._id,
          adventurerName: adv.name,
          skipped: true,
          skipReason: '分配比例未设置（需合计100%）'
        })
        continue
      }

      if (op.direction === 'up') {
        const currentComp =
          adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel - 3
        const remaining = maxCompLevel - currentComp
        if (remaining <= 0) {
          skippedResults.push({
            adventurerId: adv._id,
            adventurerName: adv.name,
            skipped: true,
            skipReason: '综合等级已达上限'
          })
          continue
        }
      }

      // 按比例计算分配
      let effectiveLevels = op.totalLevels
      if (op.direction === 'up') {
        const currentComp =
          adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel - 3
        const remaining = maxCompLevel - currentComp
        effectiveLevels = Math.min(op.totalLevels, remaining)
      }

      // 按比例分配，san 取剩余保证总数精确
      // round 最多使三项之和超出 1，此时 san=-1，从分配最多的属性减 1 修正
      const alloc = {
        attack: Math.round((effectiveLevels * ratio.attack) / 100),
        defense: Math.round((effectiveLevels * ratio.defense) / 100),
        speed: Math.round((effectiveLevels * ratio.speed) / 100),
        san: 0
      }
      alloc.san = effectiveLevels - alloc.attack - alloc.defense - alloc.speed
      if (alloc.san < 0) {
        const maxKey = ['attack', 'defense', 'speed'].reduce((a, b) =>
          alloc[a] >= alloc[b] ? a : b
        )
        alloc[maxKey] -= 1
        alloc.san = 0
      }

      if (op.direction === 'down') {
        // 检查属性等级是否足够降级
        let canDown = true
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          const stat = statMap[statType]
          if (adv[stat.level] - allocCount < 1) {
            const statName = {
              attack: '攻击',
              defense: '防御',
              speed: '速度',
              san: 'SAN'
            }[statType]
            skippedResults.push({
              adventurerId: adv._id,
              adventurerName: adv.name,
              skipped: true,
              skipReason: `${statName}等级不足以降级 ${allocCount} 级（当前 Lv.${adv[stat.level]}）`
            })
            canDown = false
            break
          }
        }
        if (!canDown) continue
      }

      // 计算该冒险家的消耗
      let advGoldNeeded = 0
      const advCrystalNeeded = {
        attackCrystal: 0,
        defenseCrystal: 0,
        speedCrystal: 0,
        sanCrystal: 0
      }

      if (op.direction === 'up') {
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          const stat = statMap[statType]
          let currentLevel = adv[stat.level]
          for (let i = 0; i < allocCount; i++) {
            advCrystalNeeded[stat.crystal] += getAdventurerLevelUpCrystalCost(
              currentLevel,
              crystalBase
            )
            advGoldNeeded += getAdventurerLevelUpGoldCost(
              currentLevel,
              goldBase
            )
            currentLevel++
          }
        }
      } else {
        advGoldNeeded = effectiveLevels * downPricePerLevel
      }

      opPlans.push({
        adv,
        alloc,
        direction: op.direction,
        totalLevels: effectiveLevels,
        goldNeeded: advGoldNeeded,
        crystalNeeded: { ...advCrystalNeeded }
      })
    }

    if (opPlans.length === 0) {
      const err = new Error('没有可操作的冒险家')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 第 2 阶段：按优先级逐个检查资源，能升的升，不够的跳过
    let remainingGold = playerInfo.gold
    const remainingCrystals = {
      attackCrystal: inventory.attackCrystal || 0,
      defenseCrystal: inventory.defenseCrystal || 0,
      speedCrystal: inventory.speedCrystal || 0,
      sanCrystal: inventory.sanCrystal || 0
    }

    const executablePlans = []
    for (const plan of opPlans) {
      // 检查资源是否足够
      if (remainingGold < plan.goldNeeded) {
        skippedResults.push({
          adventurerId: plan.adv._id,
          adventurerName: plan.adv.name,
          skipped: true,
          skipReason: `金币不足（需要 ${plan.goldNeeded}）`
        })
        continue
      }
      let crystalSufficient = true
      for (const [crystalType, needed] of Object.entries(plan.crystalNeeded)) {
        if (needed > 0 && remainingCrystals[crystalType] < needed) {
          const crystalName = {
            attackCrystal: '攻击',
            defenseCrystal: '防御',
            speedCrystal: '速度',
            sanCrystal: 'SAN'
          }[crystalType]
          skippedResults.push({
            adventurerId: plan.adv._id,
            adventurerName: plan.adv.name,
            skipped: true,
            skipReason: `${crystalName}水晶不足（需要 ${needed}，剩余 ${remainingCrystals[crystalType]}）`
          })
          crystalSufficient = false
          break
        }
      }
      if (!crystalSufficient) continue

      // 预扣资源
      remainingGold -= plan.goldNeeded
      for (const [crystalType, needed] of Object.entries(plan.crystalNeeded)) {
        remainingCrystals[crystalType] -= needed
      }
      executablePlans.push(plan)
    }

    if (executablePlans.length === 0) {
      const err = new Error('资源不足，无法为任何冒险家执行操作')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 第 3 阶段：在内存中计算所有变更，然后批量写入
    const results = []
    const bulkOps = []

    for (const plan of executablePlans) {
      const { adv, alloc, direction } = plan

      if (direction === 'up') {
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          const stat = statMap[statType]
          for (let i = 0; i < allocCount; i++) {
            const crystalCost = getAdventurerLevelUpCrystalCost(
              adv[stat.level],
              crystalBase
            )
            const goldCost = getAdventurerLevelUpGoldCost(
              adv[stat.level],
              goldBase
            )
            playerInfo.gold -= goldCost
            inventory[stat.crystal] -= crystalCost
            adv[stat.level] += 1
          }
        }
      } else {
        // down
        const totalDown = Object.values(alloc).reduce(
          (s, v) => s + Math.max(0, v),
          0
        )
        const goldCost = totalDown * downPricePerLevel
        playerInfo.gold -= goldCost
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          const stat = statMap[statType]
          adv[stat.level] -= allocCount
        }
      }

      // 重算综合等级
      const newCompLevel =
        adv.attackLevel + adv.defenseLevel + adv.speedLevel + adv.SANLevel - 3

      bulkOps.push({
        updateOne: {
          filter: { _id: adv._id },
          update: {
            $set: {
              attackLevel: adv.attackLevel,
              defenseLevel: adv.defenseLevel,
              speedLevel: adv.speedLevel,
              SANLevel: adv.SANLevel,
              comprehensiveLevel: newCompLevel
            }
          }
        }
      })

      results.push({
        adventurerId: adv._id,
        adventurerName: adv.name,
        direction,
        allocation: { ...alloc },
        newLevels: {
          attackLevel: adv.attackLevel,
          defenseLevel: adv.defenseLevel,
          speedLevel: adv.speedLevel,
          SANLevel: adv.SANLevel,
          comprehensiveLevel: newCompLevel
        }
      })
    }

    // 批量更新冒险家、玩家信息、背包，减少数据库往返
    await Promise.all([
      bulkOps.length > 0
        ? GameAdventurer.bulkWrite(bulkOps)
        : Promise.resolve(),
      playerInfo.save(),
      inventory.save()
    ])

    return { results, skipped: skippedResults }
  })
}
