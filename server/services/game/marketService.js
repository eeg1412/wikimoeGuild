import mongoose from 'mongoose'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameOfficialMarketStock from '../../models/gameOfficialMarketStock.js'
import GameMarketListing from '../../models/gameMarketListing.js'
import GameRuneStoneListing from '../../models/gameRuneStoneListing.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import { executeInLock } from '../../utils/utils.js'
import { recordActivity } from './activityService.js'

// ==================== 官方市场 ====================

/**
 * 获取官方市场信息（库存 + 价格）
 */
export async function getOfficialMarketInfo() {
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const buyPrice = gameSettings.officialCrystalBuyPrice ?? 100
  const sellPrice = gameSettings.officialCrystalSellPrice ?? 10000

  let stock = await GameOfficialMarketStock.findOne({ key: 'global' }).lean()
  if (!stock) {
    stock = await GameOfficialMarketStock.create({ key: 'global' })
    stock = stock.toJSON()
  }

  return {
    buyPrice,
    sellPrice,
    stock: {
      attackCrystal: stock.attackCrystal,
      defenseCrystal: stock.defenseCrystal,
      speedCrystal: stock.speedCrystal,
      sanCrystal: stock.sanCrystal
    },
    runeStoneOfficialPrices: {
      normal: gameSettings.officialNormalRuneStoneBuyPrice ?? 100,
      rare: gameSettings.officialRareRuneStoneBuyPrice ?? 400,
      legendary: gameSettings.officialLegendaryRuneStoneBuyPrice ?? 2000
    },
    runeFragmentBuyPrice: gameSettings.officialRuneFragmentBuyPrice ?? 10,
    runeFragmentStock: stock.runeFragment ?? 0
  }
}

/**
 * 获取各水晶类型的求购价格区间（用于快捷出售面板显示）
 */
export async function getCrystalBuyPriceRange(accountId) {
  const gameSettings = global.$globalConfig?.gameSettings || {}
  const officialBuyPrice = gameSettings.officialCrystalBuyPrice ?? 100
  const crystalTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal'
  ]

  // 聚合查询每种水晶的最高/最低求购价（排除自己的求购单）
  const matchFilter = {
    orderType: 'buy',
    status: 'active',
    materialType: { $in: crystalTypes }
  }
  if (accountId) {
    matchFilter.account = { $ne: new mongoose.Types.ObjectId(accountId) }
  }
  const pipeline = [
    {
      $match: matchFilter
    },
    {
      $group: {
        _id: '$materialType',
        minPrice: { $min: '$unitPrice' },
        maxPrice: { $max: '$unitPrice' }
      }
    }
  ]
  const aggregated = await GameMarketListing.aggregate(pipeline)
  const priceMap = {}
  for (const item of aggregated) {
    priceMap[item._id] = {
      minPrice: Math.min(item.minPrice, officialBuyPrice),
      maxPrice: Math.max(item.maxPrice, officialBuyPrice)
    }
  }
  // 对没有求购单的类型，区间就是官方价
  for (const type of crystalTypes) {
    if (!priceMap[type]) {
      priceMap[type] = {
        minPrice: officialBuyPrice,
        maxPrice: officialBuyPrice
      }
    }
  }
  return priceMap
}

/**
 * 向官方市场出售水晶
 */
export async function sellCrystalToOfficial(accountId, crystalType, quantity) {
  const validTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal'
  ]
  if (!validTypes.includes(crystalType)) {
    const err = new Error('无效的水晶类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99999) {
    const err = new Error('数量必须为1-99999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  return await executeInLock(`official-sell:${accountId}`, async () => {
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const buyPrice = gameSettings.officialCrystalBuyPrice ?? 100

    // 检查玩家库存
    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory || inventory[crystalType] < quantity) {
      const err = new Error('水晶不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const totalGold = buyPrice * quantity

    // 扣除水晶
    await GamePlayerInventory.updateOne(
      { account: accountId },
      { $inc: { [crystalType]: -quantity } }
    )

    // 增加金币
    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: totalGold } }
    )

    // 增加官方库存（上限 99999999，超过不再增加）
    const MAX_STOCK = 99999999
    const stock = await GameOfficialMarketStock.findOneAndUpdate(
      { key: 'global' },
      { $inc: { [crystalType]: quantity } },
      { upsert: true, new: true }
    )
    if (stock[crystalType] > MAX_STOCK) {
      await GameOfficialMarketStock.updateOne(
        { key: 'global' },
        { $set: { [crystalType]: MAX_STOCK } }
      )
    }

    return { goldEarned: totalGold, quantity }
  })
}

/**
 * 智能出售水晶：优先卖给素材市场求购者，剩余卖给官方
 */
export async function smartSellCrystal(accountId, crystalType, quantity) {
  const validTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal'
  ]
  if (!validTypes.includes(crystalType)) {
    const err = new Error('无效的水晶类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99999) {
    const err = new Error('数量必须为1-99999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 使用全局水晶市场锁，防止smartSell和fulfillBuyOrder同时操作同一求购单
  return await executeInLock(`crystal-market:${crystalType}`, async () => {
    // 检查玩家库存
    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory || inventory[crystalType] < quantity) {
      const err = new Error('水晶不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const gameSettings = global.$globalConfig?.gameSettings || {}
    const officialBuyPrice = gameSettings.officialCrystalBuyPrice ?? 100

    // 查找所有活跃的该水晶类型的求购订单（不包括自己的），按单价从高到低
    const buyOrders = await GameMarketListing.find({
      orderType: 'buy',
      materialType: crystalType,
      status: 'active',
      account: { $ne: accountId }
    }).sort({ unitPrice: -1, createdAt: 1 })

    let remaining = quantity
    let totalGoldFromBuyers = 0
    let soldToBuyersCount = 0
    const bulkOps = []

    // 逐个匹配求购单
    for (const order of buyOrders) {
      if (remaining <= 0) break
      // 只匹配价格 >= 官方收购价的求购单（否则不如卖给官方）
      if (order.unitPrice < officialBuyPrice) break

      const sellQty = Math.min(remaining, order.quantity)
      const gold = order.unitPrice * sellQty

      totalGoldFromBuyers += gold
      soldToBuyersCount += sellQty
      remaining -= sellQty

      // 使用原子操作批量更新求购单
      const updateFields = {
        $inc: { pendingQuantity: sellQty, quantity: -sellQty }
      }
      if (sellQty >= order.quantity) {
        updateFields.$set = { status: 'completed', quantity: 0 }
        delete updateFields.$inc.quantity
      }
      bulkOps.push({
        updateOne: {
          filter: { _id: order._id },
          update: updateFields
        }
      })
    }

    // 批量执行所有求购单更新
    if (bulkOps.length > 0) {
      await GameMarketListing.bulkWrite(bulkOps)
    }

    // 扣除玩家水晶（一次性扣除全部出售数量）
    const totalSold = soldToBuyersCount + remaining
    await GamePlayerInventory.updateOne(
      { account: accountId },
      { $inc: { [crystalType]: -totalSold } }
    )

    // 计算金币
    let totalGoldFromOfficial = 0
    if (remaining > 0) {
      totalGoldFromOfficial = officialBuyPrice * remaining
    }

    // 一次性给卖家所有金币（来自求购者 + 官方）
    const totalGold = totalGoldFromBuyers + totalGoldFromOfficial
    if (totalGold > 0) {
      await GamePlayerInfo.updateOne(
        { account: accountId },
        { $inc: { gold: totalGold } }
      )
    }

    // 剩余卖给官方：增加官方库存
    if (remaining > 0) {
      // 增加官方库存
      const MAX_STOCK = 99999999
      const stock = await GameOfficialMarketStock.findOneAndUpdate(
        { key: 'global' },
        { $inc: { [crystalType]: remaining } },
        { upsert: true, new: true }
      )
      if (stock[crystalType] > MAX_STOCK) {
        await GameOfficialMarketStock.updateOne(
          { key: 'global' },
          { $set: { [crystalType]: MAX_STOCK } }
        )
      }
    }

    return {
      goldEarned: totalGoldFromBuyers + totalGoldFromOfficial,
      soldToBuyers: soldToBuyersCount,
      soldToOfficial: remaining,
      goldFromBuyers: totalGoldFromBuyers,
      goldFromOfficial: totalGoldFromOfficial
    }
  })
}

/**
 * 从官方市场购买水晶
 */
export async function buyCrystalFromOfficial(accountId, crystalType, quantity) {
  const validTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal'
  ]
  if (!validTypes.includes(crystalType)) {
    const err = new Error('无效的水晶类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99999) {
    const err = new Error('数量必须为1-99999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  return await executeInLock(`official-buy:${crystalType}`, async () => {
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const sellPrice = gameSettings.officialCrystalSellPrice ?? 10000
    const totalCost = sellPrice * quantity

    // 检查玩家金币
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo || playerInfo.gold < totalCost) {
      const err = new Error('金币不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查官方库存
    const stock = await GameOfficialMarketStock.findOne({ key: 'global' })
    if (!stock || stock[crystalType] < quantity) {
      const err = new Error('官方市场库存不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: -totalCost } }
    )

    // 扣除官方库存
    await GameOfficialMarketStock.updateOne(
      { key: 'global' },
      { $inc: { [crystalType]: -quantity } }
    )

    // 增加水晶
    await GamePlayerInventory.findOneAndUpdate(
      { account: accountId },
      { $inc: { [crystalType]: quantity } },
      { upsert: true }
    )

    return { goldSpent: totalCost, quantity }
  })
}

/**
 * 出售符文石给官方市场
 */
export async function sellRuneStoneToOfficial(accountId, runeStoneId) {
  return await executeInLock(`official-rune-sell:${accountId}`, async () => {
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const officialPriceMap = {
      normal: gameSettings.officialNormalRuneStoneBuyPrice ?? 100,
      rare: gameSettings.officialRareRuneStoneBuyPrice ?? 400,
      legendary: gameSettings.officialLegendaryRuneStoneBuyPrice ?? 2000
    }

    // 检查符文石
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
    if (runeStone.equippedBy) {
      const err = new Error('装备中的符文石不可出售，请先卸下')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    if (runeStone.listedOnMarket) {
      const err = new Error('该符文石已在市场出售中，请先下架')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const officialPrice = officialPriceMap[runeStone.rarity]
    if (!officialPrice) {
      const err = new Error('无法识别符文石稀有度')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 删除符文石
    await GameRuneStone.deleteOne({ _id: runeStoneId })

    // 给玩家金币
    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: officialPrice } }
    )

    return {
      goldEarned: officialPrice,
      rarity: runeStone.rarity,
      level: runeStone.level
    }
  })
}

/**
 * 批量出售符文石给官方市场
 */
export async function batchSellRuneStonesToOfficial(accountId, runeStoneIds) {
  if (
    !Array.isArray(runeStoneIds) ||
    runeStoneIds.length === 0 ||
    runeStoneIds.length > 50
  ) {
    const err = new Error('请选择1-50个符文石')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  return await executeInLock(`official-rune-sell:${accountId}`, async () => {
    const gameSettings = global.$globalConfig?.gameSettings || {}
    const officialPriceMap = {
      normal: gameSettings.officialNormalRuneStoneBuyPrice ?? 100,
      rare: gameSettings.officialRareRuneStoneBuyPrice ?? 400,
      legendary: gameSettings.officialLegendaryRuneStoneBuyPrice ?? 2000
    }

    // 批量查询符文石
    const runeStones = await GameRuneStone.find({
      _id: { $in: runeStoneIds },
      account: accountId,
      equippedBy: null,
      listedOnMarket: { $ne: true }
    })

    if (runeStones.length === 0) {
      const err = new Error('没有可出售的符文石')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    let totalGold = 0
    const soldIds = []
    for (const rs of runeStones) {
      const price = officialPriceMap[rs.rarity]
      if (price) {
        totalGold += price
        soldIds.push(rs._id)
      }
    }

    if (soldIds.length === 0) {
      const err = new Error('没有可出售的符文石')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 批量删除符文石
    await GameRuneStone.deleteMany({ _id: { $in: soldIds } })

    // 给玩家金币
    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: totalGold } }
    )

    return {
      goldEarned: totalGold,
      soldCount: soldIds.length
    }
  })
}

// ==================== 自由市场 - 素材交易 ====================

/**
 * 获取素材出售列表
 */
export async function listMaterialSellOrders({
  page = 1,
  pageSize = 20,
  materialType,
  currentAccountId
} = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const validMaterialTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal',
    'runeFragment'
  ]
  const filter = { orderType: 'sell', status: 'active' }
  if (materialType && validMaterialTypes.includes(materialType))
    filter.materialType = materialType
  const total = await GameMarketListing.countDocuments(filter)
  const list = await GameMarketListing.find(filter)
    .sort({ unitPrice: 1, createdAt: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()

  // 添加公会名
  const GamePlayerInfoModel = (await import('../../models/gamePlayerInfos.js'))
    .default
  const accountIds = list.map(item => item.account)
  const infos = await GamePlayerInfoModel.find({ account: { $in: accountIds } })
    .select('account guildName')
    .lean()
  const infoMap = new Map()
  for (const info of infos) {
    infoMap.set(info.account.toString(), info.guildName)
  }
  for (const item of list) {
    const accId = item.account?.toString()
    item.guildName = infoMap.get(accId) || '未知'
    item.isMine = currentAccountId && accId === currentAccountId
    // 禁止返回 account
    delete item.account
  }

  return { list, total }
}

/**
 * 获取素材求购列表
 */
export async function listMaterialBuyOrders({
  page = 1,
  pageSize = 20,
  materialType,
  currentAccountId
} = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const validMaterialTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal',
    'runeFragment'
  ]
  const filter = { orderType: 'buy', status: 'active' }
  if (materialType && validMaterialTypes.includes(materialType))
    filter.materialType = materialType
  const total = await GameMarketListing.countDocuments(filter)
  const list = await GameMarketListing.find(filter)
    .sort({ unitPrice: -1, createdAt: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()

  const GamePlayerInfoModel = (await import('../../models/gamePlayerInfos.js'))
    .default
  const accountIds = list.map(item => item.account)
  const infos = await GamePlayerInfoModel.find({ account: { $in: accountIds } })
    .select('account guildName')
    .lean()
  const infoMap = new Map()
  for (const info of infos) {
    infoMap.set(info.account.toString(), info.guildName)
  }
  for (const item of list) {
    const accId = item.account.toString()
    item.guildName = infoMap.get(accId) || '未知'
    item.isMine = currentAccountId && accId === currentAccountId
    delete item.account
  }

  return { list, total }
}

/**
 * 发布素材出售订单
 */
export async function createMaterialSellOrder(
  accountId,
  materialType,
  quantity,
  unitPrice
) {
  const validTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal',
    'runeFragment'
  ]
  if (!validTypes.includes(materialType)) {
    const err = new Error('无效的素材类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99999) {
    const err = new Error('数量必须为1-99999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(unitPrice) || unitPrice <= 0 || unitPrice > 99999999) {
    const err = new Error('单价必须为1-99999999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const gameSettings = global.$globalConfig?.gameSettings || {}
  const minPrice = gameSettings.freeMarketMinPrice ?? 100
  if (unitPrice < minPrice) {
    const err = new Error(`单价不得低于 ${minPrice} 金币`)
    err.statusCode = 400
    err.expose = true
    throw err
  }

  return await executeInLock(`market-sell:${accountId}`, async () => {
    // 检查库存
    const inventory = await GamePlayerInventory.findOne({ account: accountId })
    if (!inventory || inventory[materialType] < quantity) {
      const err = new Error('素材不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除素材
    await GamePlayerInventory.updateOne(
      { account: accountId },
      { $inc: { [materialType]: -quantity } }
    )

    // 创建订单
    const order = await GameMarketListing.create({
      account: accountId,
      orderType: 'sell',
      materialType,
      quantity,
      originalQuantity: quantity,
      unitPrice
    })

    // 记录动态：发布出售
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
      .select('guildName')
      .lean()
    const matLabels = {
      attackCrystal: '攻击水晶',
      defenseCrystal: '防御水晶',
      speedCrystal: '速度水晶',
      sanCrystal: 'SAN水晶',
      runeFragment: '符文石碎片'
    }
    recordActivity({
      type: 'market_listing',
      account: accountId,
      guildName: playerInfo?.guildName,
      title: `「${playerInfo?.guildName}」发布了${matLabels[materialType] || materialType}出售`,
      content: `${quantity}个 ${matLabels[materialType] || materialType}，单价 ${unitPrice} 金币`,
      extra: { orderType: 'sell', materialType, quantity, unitPrice }
    })

    const safeOrder = order.toJSON()
    delete safeOrder.account
    return safeOrder
  })
}

/**
 * 发布素材求购订单
 */
export async function createMaterialBuyOrder(
  accountId,
  materialType,
  quantity,
  unitPrice
) {
  const validTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal',
    'runeFragment'
  ]
  if (!validTypes.includes(materialType)) {
    const err = new Error('无效的素材类型')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99999) {
    const err = new Error('数量必须为1-99999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }
  if (!Number.isInteger(unitPrice) || unitPrice <= 0 || unitPrice > 99999999) {
    const err = new Error('单价必须为1-99999999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const gameSettings = global.$globalConfig?.gameSettings || {}
  const minPrice = gameSettings.freeMarketMinPrice ?? 100
  if (unitPrice < minPrice) {
    const err = new Error(`单价不得低于 ${minPrice} 金币`)
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const totalCost = unitPrice * quantity

  return await executeInLock(`market-buy:${accountId}`, async () => {
    // 检查金币
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
    if (!playerInfo || playerInfo.gold < totalCost) {
      const err = new Error('金币不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除金币
    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: -totalCost } }
    )

    // 创建求购订单
    const order = await GameMarketListing.create({
      account: accountId,
      orderType: 'buy',
      materialType,
      quantity,
      originalQuantity: quantity,
      unitPrice
    })

    // 记录动态：发布求购
    const matLabels2 = {
      attackCrystal: '攻击水晶',
      defenseCrystal: '防御水晶',
      speedCrystal: '速度水晶',
      sanCrystal: 'SAN水晶',
      runeFragment: '符文石碎片'
    }
    recordActivity({
      type: 'market_listing',
      account: accountId,
      guildName: playerInfo?.guildName,
      title: `「${playerInfo?.guildName}」发布了${matLabels2[materialType] || materialType}求购`,
      content: `求购 ${quantity}个 ${matLabels2[materialType] || materialType}，单价 ${unitPrice} 金币`,
      extra: { orderType: 'buy', materialType, quantity, unitPrice }
    })

    const safeOrder = order.toJSON()
    delete safeOrder.account
    return safeOrder
  })
}

/**
 * 购买素材卖单
 */
export async function fulfillMaterialSellOrder(
  buyerAccountId,
  orderId,
  quantity
) {
  return await executeInLock(`market-fulfill:${orderId}`, async () => {
    const order = await GameMarketListing.findOne({
      _id: orderId,
      orderType: 'sell',
      status: 'active'
    })
    if (!order) {
      const err = new Error('订单不存在或已完成')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (order.account.toString() === buyerAccountId) {
      const err = new Error('不能购买自己的订单')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 确定购买数量
    const buyQty =
      quantity && Number.isInteger(quantity) && quantity > 0
        ? Math.min(quantity, order.quantity)
        : order.quantity

    const totalCost = order.unitPrice * buyQty

    // 检查买家金币
    const buyerInfo = await GamePlayerInfo.findOne({ account: buyerAccountId })
    if (!buyerInfo || buyerInfo.gold < totalCost) {
      const err = new Error('金币不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除买家金币
    await GamePlayerInfo.updateOne(
      { account: buyerAccountId },
      { $inc: { gold: -totalCost } }
    )

    // 给买家素材（买家立即获得）
    await GamePlayerInventory.findOneAndUpdate(
      { account: buyerAccountId },
      { $inc: { [order.materialType]: buyQty } },
      { upsert: true }
    )

    // 卖家金币暂存到订单 pendingGold，不立即到账
    order.pendingGold = (order.pendingGold || 0) + totalCost

    // 更新订单
    if (buyQty >= order.quantity) {
      order.quantity = 0
      order.status = 'completed'
    } else {
      order.quantity -= buyQty
    }
    await order.save()

    return {
      goldSpent: totalCost,
      materialType: order.materialType,
      quantity: buyQty
    }
  })
}

/**
 * 出售素材给求购者
 */
export async function fulfillMaterialBuyOrder(
  sellerAccountId,
  orderId,
  quantity
) {
  const crystalTypes = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal'
  ]

  // 先读取订单确定素材类型
  const orderCheck = await GameMarketListing.findOne({
    _id: orderId,
    orderType: 'buy',
    status: 'active'
  })
  if (!orderCheck) {
    const err = new Error('求购订单不存在或已完成')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 如果是水晶类型，使用全局水晶市场锁（与smartSellCrystal共享），否则用订单锁
  const lockKey = crystalTypes.includes(orderCheck.materialType)
    ? `crystal-market:${orderCheck.materialType}`
    : `market-fulfill:${orderId}`

  return await executeInLock(lockKey, async () => {
    // 重新读取订单（锁内再次确认状态）
    const order = await GameMarketListing.findOne({
      _id: orderId,
      orderType: 'buy',
      status: 'active'
    })
    if (!order) {
      const err = new Error('求购订单不存在或已完成')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (order.account.toString() === sellerAccountId) {
      const err = new Error('不能出售给自己的求购')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 确定出售数量
    const sellQty =
      quantity && Number.isInteger(quantity) && quantity > 0
        ? Math.min(quantity, order.quantity)
        : order.quantity

    // 检查卖家素材
    const inventory = await GamePlayerInventory.findOne({
      account: sellerAccountId
    })
    if (!inventory || inventory[order.materialType] < sellQty) {
      const err = new Error('素材不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    const totalGold = order.unitPrice * sellQty

    // 扣除卖家素材
    await GamePlayerInventory.updateOne(
      { account: sellerAccountId },
      { $inc: { [order.materialType]: -sellQty } }
    )

    // 给卖家金币（求购者下单时已扣除金币，立即结算给卖家）
    await GamePlayerInfo.updateOne(
      { account: sellerAccountId },
      { $inc: { gold: totalGold } }
    )

    // 求购者素材暂存到订单 pendingQuantity，不立即到账
    order.pendingQuantity = (order.pendingQuantity || 0) + sellQty

    // 更新订单
    if (sellQty >= order.quantity) {
      order.quantity = 0
      order.status = 'completed'
    } else {
      order.quantity -= sellQty
    }
    await order.save()

    return {
      goldEarned: totalGold,
      materialType: order.materialType,
      quantity: sellQty
    }
  })
}

/**
 * 下架/取消订单（赎回素材或金币）
 */
export async function cancelMaterialOrder(accountId, orderId) {
  return await executeInLock(`market-cancel:${accountId}`, async () => {
    const order = await GameMarketListing.findOne({
      _id: orderId,
      account: accountId,
      status: 'active'
    })
    if (!order) {
      const err = new Error('订单不存在或已完成')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (order.orderType === 'sell') {
      // 出售单：退回剩余未售出素材
      if (order.quantity > 0) {
        await GamePlayerInventory.findOneAndUpdate(
          { account: accountId },
          { $inc: { [order.materialType]: order.quantity } },
          { upsert: true }
        )
      }
    } else {
      // 求购单：退回剩余冻结金币
      if (order.quantity > 0) {
        const remainingGold = order.unitPrice * order.quantity
        await GamePlayerInfo.updateOne(
          { account: accountId },
          { $inc: { gold: remainingGold } }
        )
      }
    }

    order.quantity = 0
    order.status = 'cancelled'
    await order.save()

    return { success: true }
  })
}

/**
 * 获取我的素材订单列表
 */
export async function listMyMaterialOrders(
  accountId,
  { page = 1, pageSize = 20, orderType, status } = {}
) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const validOrderTypes = ['sell', 'buy']
  const validStatuses = ['active', 'completed', 'cancelled']
  const filter = { account: accountId }
  if (orderType && validOrderTypes.includes(orderType))
    filter.orderType = orderType
  if (status && validStatuses.includes(status)) filter.status = status

  const total = await GameMarketListing.countDocuments(filter)
  const list = await GameMarketListing.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('-account')
    .lean()

  return { list, total }
}

// ==================== 自由市场 - 符文石交易 ====================

/**
 * 获取符文石出售列表
 */
export async function listRuneStoneListings({
  page = 1,
  pageSize = 20,
  rarity,
  currentAccountId
} = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const validRarities = ['normal', 'rare', 'legendary']
  if (rarity && !validRarities.includes(rarity)) rarity = undefined
  const filter = { status: 'active' }
  const total = await GameRuneStoneListing.countDocuments(filter)
  let query = GameRuneStoneListing.find(filter)
    .sort({ price: 1, createdAt: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate({
      path: 'runeStone',
      match: rarity ? { rarity } : {}
    })
    .lean()

  let list = await query

  // 过滤掉populate后runeStone为null的（rarity不匹配时）
  if (rarity) {
    list = list.filter(item => item.runeStone != null)
  }

  // 添加公会名
  const GamePlayerInfoModel = (await import('../../models/gamePlayerInfos.js'))
    .default
  const accountIds = list.map(item => item.account)
  const infos = await GamePlayerInfoModel.find({ account: { $in: accountIds } })
    .select('account guildName')
    .lean()
  const infoMap = new Map()
  for (const info of infos) {
    infoMap.set(info.account.toString(), info.guildName)
  }
  for (const item of list) {
    const accId = item.account.toString()
    item.guildName = infoMap.get(accId) || '未知'
    item.isMine = currentAccountId && accId === currentAccountId
    delete item.account
  }

  return { list, total }
}

/**
 * 发布符文石出售
 */
export async function createRuneStoneListing(accountId, runeStoneId, price) {
  if (!Number.isInteger(price) || price <= 0 || price > 99999999) {
    const err = new Error('价格必须为1-99999999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const gameSettings = global.$globalConfig?.gameSettings || {}
  const minPrice = gameSettings.freeMarketRuneStoneMinPrice ?? 100
  if (price < minPrice) {
    const err = new Error(`价格不得低于 ${minPrice} 金币`)
    err.statusCode = 400
    err.expose = true
    throw err
  }

  return await executeInLock(`rune-listing:${accountId}`, async () => {
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
    if (runeStone.equippedBy) {
      const err = new Error('装备中的符文石不可出售，请先卸下')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查是否已上架
    const existListing = await GameRuneStoneListing.findOne({
      runeStone: runeStoneId,
      status: 'active'
    })
    if (existListing) {
      const err = new Error('该符文石已在市场出售中')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 暂扣符文石（设置 listedOnMarket 标记）
    runeStone.listedOnMarket = true
    await runeStone.save()

    // 检查是否低于官方市场收购价格，如果低于则立即被官方收购
    const officialPriceMap = {
      normal: gameSettings.officialNormalRuneStoneBuyPrice ?? 100,
      rare: gameSettings.officialRareRuneStoneBuyPrice ?? 400,
      legendary: gameSettings.officialLegendaryRuneStoneBuyPrice ?? 2000
    }
    const officialPrice = officialPriceMap[runeStone.rarity]
    if (officialPrice && price <= officialPrice) {
      // 官方市场立即收购：删除符文石，给玩家官方收购价金币
      await GameRuneStone.deleteOne({ _id: runeStoneId })

      // 给卖家官方收购价金币
      await GamePlayerInfo.updateOne(
        { account: accountId },
        { $inc: { gold: officialPrice } }
      )

      // 创建一个已完成的挂单记录
      const listing = await GameRuneStoneListing.create({
        account: accountId,
        runeStone: runeStoneId,
        price: officialPrice,
        status: 'completed'
      })

      // 记录动态：符文石被官方收购
      const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
        .select('guildName')
        .lean()
      const rarityLabels = { normal: '普通', rare: '稀有', legendary: '传说' }
      recordActivity({
        type: 'market_listing',
        account: accountId,
        guildName: playerInfo?.guildName,
        title: `「${playerInfo?.guildName}」的符文石被官方收购`,
        content: `${rarityLabels[runeStone.rarity] || runeStone.rarity} Lv.${runeStone.level} 符文石被官方以 ${officialPrice} 金币收购`,
        extra: {
          orderType: 'rune_sell',
          rarity: runeStone.rarity,
          level: runeStone.level,
          price: officialPrice,
          officialPurchase: true
        }
      })

      return {
        ...listing.toJSON(),
        account: undefined,
        officialPurchased: true,
        goldEarned: officialPrice
      }
    }

    const listing = await GameRuneStoneListing.create({
      account: accountId,
      runeStone: runeStoneId,
      price
    })

    // 记录动态：发布符文石出售
    const playerInfo = await GamePlayerInfo.findOne({ account: accountId })
      .select('guildName')
      .lean()
    const rarityLabels = { normal: '普通', rare: '稀有', legendary: '传说' }
    recordActivity({
      type: 'market_listing',
      account: accountId,
      guildName: playerInfo?.guildName,
      title: `「${playerInfo?.guildName}」上架了一颗符文石`,
      content: `${rarityLabels[runeStone.rarity] || runeStone.rarity} Lv.${runeStone.level} 符文石，价格 ${price} 金币`,
      extra: {
        orderType: 'rune_sell',
        rarity: runeStone.rarity,
        level: runeStone.level,
        price
      }
    })

    const safeListing = listing.toJSON()
    delete safeListing.account
    return safeListing
  })
}

/**
 * 购买符文石
 */
export async function buyRuneStoneListing(buyerAccountId, listingId) {
  return await executeInLock(`rune-buy:${listingId}`, async () => {
    const listing = await GameRuneStoneListing.findOne({
      _id: listingId,
      status: 'active'
    })
    if (!listing) {
      const err = new Error('商品不存在或已下架')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (listing.account.toString() === buyerAccountId) {
      const err = new Error('不能购买自己的商品')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查买家金币
    const buyerInfo = await GamePlayerInfo.findOne({ account: buyerAccountId })
    if (!buyerInfo || buyerInfo.gold < listing.price) {
      const err = new Error('金币不足')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 检查买家符文石数量上限
    const buyerRuneStoneCount = await GameRuneStone.countDocuments({
      account: buyerAccountId
    })
    if (buyerRuneStoneCount >= 500) {
      const err = new Error(
        '符文石数量已达上限（500个），请先分解或出售多余的符文石'
      )
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 扣除买家金币
    await GamePlayerInfo.updateOne(
      { account: buyerAccountId },
      { $inc: { gold: -listing.price } }
    )

    // 卖家金币暂存到挂单 pendingGold，不立即到账
    listing.pendingGold = (listing.pendingGold || 0) + listing.price

    // 转移符文石归属并解除市场标记
    await GameRuneStone.updateOne(
      { _id: listing.runeStone },
      { account: buyerAccountId, equippedBy: null, listedOnMarket: false }
    )

    listing.status = 'completed'
    await listing.save()

    return { goldSpent: listing.price }
  })
}

/**
 * 下架符文石
 */
export async function cancelRuneStoneListing(accountId, listingId) {
  return await executeInLock(`rune-cancel:${accountId}`, async () => {
    const listing = await GameRuneStoneListing.findOne({
      _id: listingId,
      account: accountId,
      status: 'active'
    })
    if (!listing) {
      const err = new Error('商品不存在或已下架')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    listing.status = 'cancelled'
    await listing.save()

    // 解除市场标记
    await GameRuneStone.updateOne(
      { _id: listing.runeStone },
      { listedOnMarket: false }
    )

    return { success: true }
  })
}

/**
 * 获取我的符文石挂单
 */
export async function listMyRuneStoneListings(
  accountId,
  { page = 1, pageSize = 20, status } = {}
) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const validStatuses = ['active', 'completed', 'cancelled']
  const filter = { account: accountId }
  if (status && validStatuses.includes(status)) filter.status = status

  const total = await GameRuneStoneListing.countDocuments(filter)
  const list = await GameRuneStoneListing.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('-account')
    .populate('runeStone')
    .lean()

  return { list, total }
}

// ==================== 收取机制 ====================

/**
 * 收取素材订单的待领取物品（金币或素材）
 */
export async function collectMaterialOrder(accountId, orderId) {
  return await executeInLock(`market-collect:${accountId}`, async () => {
    const order = await GameMarketListing.findOne({
      _id: orderId,
      account: accountId
    })
    if (!order) {
      const err = new Error('订单不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    const result = {}

    if (order.orderType === 'sell' && order.pendingGold > 0) {
      // 出售单：收取待领取金币
      await GamePlayerInfo.updateOne(
        { account: accountId },
        { $inc: { gold: order.pendingGold } }
      )
      result.goldCollected = order.pendingGold
      order.pendingGold = 0
      await order.save()
    } else if (order.orderType === 'buy' && order.pendingQuantity > 0) {
      // 求购单：收取待领取素材
      await GamePlayerInventory.findOneAndUpdate(
        { account: accountId },
        { $inc: { [order.materialType]: order.pendingQuantity } },
        { upsert: true }
      )
      result.materialCollected = order.pendingQuantity
      result.materialType = order.materialType
      order.pendingQuantity = 0
      await order.save()
    } else {
      const err = new Error('没有可收取的物品')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    return result
  })
}

/**
 * 收取符文石挂单的待领取金币
 */
export async function collectRuneStoneListing(accountId, listingId) {
  return await executeInLock(`rune-collect:${accountId}`, async () => {
    const listing = await GameRuneStoneListing.findOne({
      _id: listingId,
      account: accountId
    })
    if (!listing) {
      const err = new Error('挂单不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }

    if (!listing.pendingGold || listing.pendingGold <= 0) {
      const err = new Error('没有可收取的金币')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    await GamePlayerInfo.updateOne(
      { account: accountId },
      { $inc: { gold: listing.pendingGold } }
    )

    const goldCollected = listing.pendingGold
    listing.pendingGold = 0
    await listing.save()

    return { goldCollected }
  })
}

// ==================== 官方市场 - 符文石碎片收购 ====================

/**
 * 向官方市场出售符文石碎片
 */
export async function sellRuneFragmentToOfficial(accountId, quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99999) {
    const err = new Error('数量必须为1-99999的正整数')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  return await executeInLock(
    `official-rune-frag-sell:${accountId}`,
    async () => {
      const gameSettings = global.$globalConfig?.gameSettings || {}
      const buyPrice = gameSettings.officialRuneFragmentBuyPrice ?? 10

      // 检查玩家库存
      const inventory = await GamePlayerInventory.findOne({
        account: accountId
      })
      if (!inventory || inventory.runeFragment < quantity) {
        const err = new Error('符文石碎片不足')
        err.statusCode = 400
        err.expose = true
        throw err
      }

      const totalGold = buyPrice * quantity

      // 扣除符文石碎片
      await GamePlayerInventory.updateOne(
        { account: accountId },
        { $inc: { runeFragment: -quantity } }
      )

      // 增加金币
      await GamePlayerInfo.updateOne(
        { account: accountId },
        { $inc: { gold: totalGold } }
      )

      // 增加官方库存（上限 99999999，超过不再增加）
      const MAX_STOCK = 99999999
      const stock = await GameOfficialMarketStock.findOneAndUpdate(
        { key: 'global' },
        { $inc: { runeFragment: quantity } },
        { upsert: true, new: true }
      )
      if (stock.runeFragment > MAX_STOCK) {
        await GameOfficialMarketStock.updateOne(
          { key: 'global' },
          { $set: { runeFragment: MAX_STOCK } }
        )
      }

      return { goldEarned: totalGold, quantity }
    }
  )
}

// ==================== 管理后台 - 官方市场库存管理 ====================

/**
 * 获取官方市场库存（管理用）
 */
export async function getOfficialMarketStock() {
  let stock = await GameOfficialMarketStock.findOne({ key: 'global' }).lean()
  if (!stock) {
    stock = await GameOfficialMarketStock.create({ key: 'global' })
    stock = stock.toJSON()
  }
  return {
    attackCrystal: stock.attackCrystal,
    defenseCrystal: stock.defenseCrystal,
    speedCrystal: stock.speedCrystal,
    sanCrystal: stock.sanCrystal,
    runeFragment: stock.runeFragment ?? 0
  }
}

/**
 * 设置官方市场库存（管理用）
 */
export async function updateOfficialMarketStock(stockData) {
  const validFields = [
    'attackCrystal',
    'defenseCrystal',
    'speedCrystal',
    'sanCrystal'
  ]
  const update = {}
  for (const field of validFields) {
    if (stockData[field] !== undefined) {
      const val = parseInt(stockData[field])
      if (!Number.isInteger(val) || val < 0 || val > 99999999) {
        const err = new Error(`${field} 必须为0-99999999之间的整数`)
        err.statusCode = 400
        err.expose = true
        throw err
      }
      update[field] = val
    }
  }

  if (Object.keys(update).length === 0) {
    const err = new Error('没有有效的库存数据')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  await GameOfficialMarketStock.findOneAndUpdate(
    { key: 'global' },
    { $set: update },
    { upsert: true }
  )

  return await getOfficialMarketStock()
}
