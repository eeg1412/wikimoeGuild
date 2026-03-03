import GameRuneStone from '../../models/gameRuneStone.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameAdventurer from '../../models/gameAdventurer.js'
import { executeInLock } from '../../utils/utils.js'
import { runeStoneActiveSkillDataBase } from 'shared/utils/gameDatabase.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { jwtKeys } from '../../config/jwtKeys.js'

/**
 * 生成符文石
 * @param {string} accountId - 玩家账号ID
 * @param {string} rarity - 稀有度: normal, rare, legendary
 * @param {number} [level=1] - 初始等级
 * @returns {object} 生成的符文石
 */
export async function generateRuneStone(accountId, rarity, level = 1) {
  // 检查玩家符文石数量上限
  const runeStoneCount = await GameRuneStone.countDocuments({
    account: accountId
  })
  if (runeStoneCount >= 500) {
    const err = new Error(
      '符文石数量已达上限（500个），请先分解或出售多余的符文石'
    )
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const allSkills = runeStoneActiveSkillDataBase()

  let activeSkillCount, passiveBuffCount, buffLevelMin, buffLevelMax
  switch (rarity) {
    case 'normal':
      activeSkillCount = 1
      passiveBuffCount = 2
      buffLevelMin = 1
      buffLevelMax = 10
      break
    case 'rare':
      activeSkillCount = 2
      passiveBuffCount = 4
      buffLevelMin = 11
      buffLevelMax = 20
      break
    case 'legendary':
      activeSkillCount = 3
      passiveBuffCount = 6
      buffLevelMin = 21
      buffLevelMax = 30
      break
    default:
      throw new Error('无效的符文石稀有度')
  }

  // 随机选取主动技能（不重复）
  const shuffledSkills = [...allSkills].sort(() => Math.random() - 0.5)
  const activeSkills = shuffledSkills
    .slice(0, activeSkillCount)
    .map(skill => ({ skillId: skill.value }))

  // 随机生成被动增益
  const buffTypes = ['attack', 'defense', 'speed', 'san']
  const passiveBuffs = []
  for (let i = 0; i < passiveBuffCount; i++) {
    const buffType = buffTypes[Math.floor(Math.random() * buffTypes.length)]
    const buffLevel =
      Math.floor(Math.random() * (buffLevelMax - buffLevelMin + 1)) +
      buffLevelMin
    passiveBuffs.push({ buffType, buffLevel })
  }

  const runeStone = await GameRuneStone.create({
    account: accountId,
    rarity,
    level,
    activeSkills,
    passiveBuffs
  })

  const result = runeStone.toJSON()
  delete result.account
  return result
}

/**
 * 根据掉率配置随机生成符文石
 * @param {string} accountId
 * @returns {object|null} 生成的符文石或null（未掉落）
 */
export async function tryDropRuneStone(accountId, level = 1) {
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const dropRate = gameSettings.runeStoneDropRate ?? 100

  // dropRate / 10000 的概率掉落
  const roll = Math.floor(Math.random() * 10000)
  if (roll >= dropRate) return null

  // 二次随机稀有度
  const normalRate = gameSettings.normalRuneStoneRate ?? 8000
  const rareRate = gameSettings.rareRuneStoneRate ?? 1500
  const legendaryRate = gameSettings.legendaryRuneStoneRate ?? 500
  const totalRarityRate = normalRate + rareRate + legendaryRate

  const rarityRoll = Math.floor(Math.random() * totalRarityRate)
  let rarity
  if (rarityRoll < normalRate) {
    rarity = 'normal'
  } else if (rarityRoll < normalRate + rareRate) {
    rarity = 'rare'
  } else {
    rarity = 'legendary'
  }

  return await generateRuneStone(accountId, rarity, level)
}

/**
 * 获取玩家的符文石列表
 */
export async function listMyRuneStones(
  accountId,
  { page = 1, pageSize = 20, rarity, equipped, sort = 'newest' } = {}
) {
  const filter = { account: accountId }
  if (rarity) filter.rarity = rarity
  if (equipped === 'true') filter.equippedBy = { $ne: null }
  if (equipped === 'false') filter.equippedBy = null

  // 排序方式
  const RARITY_ORDER = { legendary: 0, rare: 1, normal: 2 }
  let sortOption
  switch (sort) {
    case 'oldest':
      sortOption = { createdAt: 1 }
      break
    case 'level_desc':
      sortOption = { level: -1, createdAt: -1 }
      break
    case 'level_asc':
      sortOption = { level: 1, createdAt: -1 }
      break
    case 'rarity':
      // MongoDB不支持自定义枚举排序，先查全部再内存排序
      break
    default:
      sortOption = { createdAt: -1 }
  }

  const total = await GameRuneStone.countDocuments(filter)

  let list
  if (sort === 'rarity') {
    // 稀有度排序需要在内存中处理
    const allList = await GameRuneStone.find(filter).select('-account').lean()
    allList.sort((a, b) => {
      const diff = (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9)
      if (diff !== 0) return diff
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
    list = allList.slice((page - 1) * pageSize, page * pageSize)
  } else {
    list = await GameRuneStone.find(filter)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select('-account')
      .lean()
  }

  return { list, total }
}

/**
 * 分解符文石
 * 稀有度系数: normal=10, rare=100, legendary=500
 * 碎片 = 系数 × 等级
 */
export async function decomposeRuneStone(accountId, runeStoneId) {
  return await executeInLock(`decompose:${accountId}`, async () => {
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

    // 装备中的符文石不可分解
    if (runeStone.equippedBy) {
      const err = new Error('装备中的符文石不可分解，请先卸下')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 上架中的符文石不可分解
    if (runeStone.listedOnMarket) {
      const err = new Error('市场上架中的符文石不可分解，请先下架')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const rarityCoeff = { normal: 10, rare: 100, legendary: 500 }
    const fragments = rarityCoeff[runeStone.rarity] * runeStone.level

    // 增加碎片
    await GamePlayerInventory.findOneAndUpdate(
      { account: accountId },
      { $inc: { runeFragment: fragments } },
      { upsert: true, returnDocument: 'after' }
    )

    // 删除符文石
    await GameRuneStone.deleteOne({ _id: runeStoneId })

    return { fragments }
  })
}

/**
 * 升级符文石
 * 普通: 100 × 当前等级
 * 稀有: 1000 × 当前等级
 * 传说: 5000 × 当前等级
 */
export async function upgradeRuneStone(accountId, runeStoneId) {
  return await executeInLock(`upgrade:${accountId}`, async () => {
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

    // 上架中的符文石不可升级
    if (runeStone.listedOnMarket) {
      const err = new Error('市场上架中的符文石不可升级，请先下架')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 如果符文石已装备，升级后等级不能超过装备者的综合等级
    if (runeStone.equippedBy) {
      const adventurer = await GameAdventurer.findById(runeStone.equippedBy)
      if (!adventurer) {
        const err = new Error('装备者信息异常')
        err.statusCode = 400
        err.expose = true
        throw err
      }
      if (runeStone.level + 1 > adventurer.comprehensiveLevel) {
        const err = new Error(
          `符文石等级不能超过装备者的综合等级（当前综合等级 ${adventurer.comprehensiveLevel}）`
        )
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    const costCoeff = { normal: 100, rare: 1000, legendary: 5000 }
    const cost = costCoeff[runeStone.rarity] * runeStone.level

    // 检查碎片是否足够
    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory || inventory.runeFragment < cost) {
      const err = new Error(`符文石碎片不足，需要 ${cost} 个`)
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除碎片
    await GamePlayerInventory.updateOne(
      { account: accountId },
      { $inc: { runeFragment: -cost } }
    )

    // 升级
    runeStone.level += 1
    await runeStone.save()

    const result = runeStone.toJSON()
    delete result.account
    return result
  })
}

/**
 * 获取单个符文石详情
 */
export async function getRuneStoneDetail(accountId, runeStoneId) {
  const runeStone = await GameRuneStone.findOne({
    _id: runeStoneId,
    account: accountId
  })
    .select('-account')
    .lean()
  if (!runeStone) {
    const err = new Error('符文石不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return runeStone
}

/**
 * 符文石合成 - 预览
 * 两个相同稀有度的未装备符文石合成预览
 */
export async function previewSynthesis(
  accountId,
  mainRuneStoneId,
  materialRuneStoneId
) {
  if (mainRuneStoneId === materialRuneStoneId) {
    const err = new Error('主符文石和素材符文石不能相同')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const [mainRS, materialRS] = await Promise.all([
    GameRuneStone.findOne({ _id: mainRuneStoneId, account: accountId })
      .select('-account')
      .lean(),
    GameRuneStone.findOne({
      _id: materialRuneStoneId,
      account: accountId
    })
      .select('-account')
      .lean()
  ])

  if (!mainRS || !materialRS) {
    const err = new Error('符文石不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  // 主符文石如果已装备，合成后等级不能超过装备者综合等级（仅预警，在确认阶段检查）
  // 素材符文石可以是装备中的（将自动卸下）
  if (mainRS.listedOnMarket || materialRS.listedOnMarket) {
    const err = new Error('市场上架中的符文石不可合成，请先下架')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (mainRS.rarity !== materialRS.rarity) {
    const err = new Error('只有相同稀有度的符文石才能合成')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 使用 Fisher-Yates 洗牌
  function fisherYatesShuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // 计算合成结果
  const newLevel = Math.max(
    Math.floor((mainRS.level + materialRS.level) / 2),
    1
  )

  // 随机交叉产生主动技能
  const allActiveSkills = [...mainRS.activeSkills, ...materialRS.activeSkills]
  const shuffledSkills = fisherYatesShuffle(allActiveSkills)
  const skillCount = mainRS.activeSkills.length
  const newActiveSkills = shuffledSkills.slice(0, skillCount)

  // 随机交叉产生被动增益
  const allPassiveBuffs = [...mainRS.passiveBuffs, ...materialRS.passiveBuffs]
  const shuffledBuffs = fisherYatesShuffle(allPassiveBuffs)
  const buffCount = mainRS.passiveBuffs.length
  const newPassiveBuffs = shuffledBuffs.slice(0, buffCount)

  const preview = {
    rarity: mainRS.rarity,
    level: newLevel,
    activeSkills: newActiveSkills,
    passiveBuffs: newPassiveBuffs
  }

  return await executeInLock(`synthesis-preview:${accountId}`, async () => {
    // 再次查询以防并发
    const finalMaterialRS = await GameRuneStone.findOne({
      _id: materialRuneStoneId,
      account: accountId,
      listedOnMarket: false
    })

    if (!finalMaterialRS) {
      const err = new Error('素材符文石不可用或已被消耗')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const currentMainRS = await GameRuneStone.findOne({
      _id: mainRuneStoneId,
      account: accountId,
      listedOnMarket: false
    })

    if (!currentMainRS) {
      const err = new Error('主符文石不可用')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 如果素材符文石已装备，先自动卸下
    if (finalMaterialRS.equippedBy) {
      await GameAdventurer.updateOne(
        { _id: finalMaterialRS.equippedBy },
        { $unset: { runeStone: 1 } }
      )
      finalMaterialRS.equippedBy = null
      await finalMaterialRS.save()
    }

    // 销毁素材石头
    await GameRuneStone.deleteOne({ _id: materialRuneStoneId })
    const synthesisVersion = currentMainRS.synthesisVersion || 0

    // 签发 JWT
    const payload = {
      accountId,
      mainRuneStoneId,
      synthesisVersion,
      preview: preview
    }

    const previewToken = jwt.sign(payload, jwtKeys.cacheSecret, {
      expiresIn: '1d'
    })

    return {
      mainRuneStone: mainRS,
      materialRuneStone: materialRS,
      preview,
      previewToken
    }
  })
}

/**
 * 符文石合成 - 确认执行
 */
export async function confirmSynthesis(accountId, previewToken, accept) {
  // 不论是否接受，因为素材已在预览阶段销毁，这里如果放弃，则直接返回
  if (!accept) {
    return { accepted: false }
  }

  let decoded
  try {
    decoded = jwt.verify(previewToken, jwtKeys.cacheSecret)
  } catch (e) {
    const err = new Error('预览已失效或验签失败')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const {
    accountId: tokenAccountId,
    mainRuneStoneId,
    synthesisVersion,
    preview
  } = decoded

  if (tokenAccountId !== accountId) {
    const err = new Error('无权确认他人的合成')
    err.statusCode = 403
    err.expose = true
    throw err
  }

  return await executeInLock(`synthesis:${accountId}`, async () => {
    const mainRS = await GameRuneStone.findOne({
      _id: mainRuneStoneId,
      account: accountId
    })

    if (!mainRS) {
      const err = new Error('主符文石不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    // 乐观锁：比对合成版本
    if ((mainRS.synthesisVersion || 0) !== synthesisVersion) {
      const err = new Error('主符文石已被其他操作更改，当前预览结果已失效')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    if (mainRS.listedOnMarket) {
      const err = new Error('市场上架中的符文石不可合成，请先下架')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 如果主符文石已装备，检查合成后等级不超过装备者综合等级
    if (mainRS.equippedBy) {
      const adventurer = await GameAdventurer.findById(mainRS.equippedBy)
      if (adventurer && preview.level > adventurer.comprehensiveLevel) {
        const err = new Error(
          `合成后等级(${preview.level})不能超过装备者综合等级(${adventurer.comprehensiveLevel})`
        )
        err.statusCode = 400
        err.expose = true
        throw err
      }
    }

    // 接受合成：使用预览时生成的结果并更新版本号
    mainRS.level = preview.level
    mainRS.activeSkills = preview.activeSkills
    mainRS.passiveBuffs = preview.passiveBuffs
    mainRS.synthesisVersion = (mainRS.synthesisVersion || 0) + 1
    await mainRS.save()

    const result = mainRS.toJSON()
    delete result.account
    return { accepted: true, runeStone: result }
  })
}
