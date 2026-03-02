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

    // 检查冒险家数量限制
    if (playerInfo.adventurerCount >= 50) {
      const err = new Error('每个账号最多可以招募50名冒险家')
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
 */
export async function levelUpStat(accountId, adventurerId, statType) {
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

    // 检查金币（500金币）
    if (playerInfo.gold < 500) {
      const err = new Error('金币不足，需要 500 金币')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查水晶（50个）
    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory || inventory[stat.crystal] < 50) {
      const err = new Error(`水晶不足，需要 50 个`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    playerInfo.gold -= 500
    await playerInfo.save()

    // 扣除水晶
    await GamePlayerInventory.updateOne(
      { account: accountId },
      { $inc: { [stat.crystal]: -50 } }
    )

    // 升级
    adventurer[stat.level] += 1
    // 重新计算综合等级 = 升级次数 + 1
    adventurer.comprehensiveLevel =
      adventurer.attackLevel +
      adventurer.defenseLevel +
      adventurer.speedLevel +
      adventurer.SANLevel -
      3
    await adventurer.save()

    return await GameAdventurer.findById(adventurer._id)
      .select('-account')
      .populate('runeStone')
      .lean()
  })
}

/**
 * 装备符文石
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
