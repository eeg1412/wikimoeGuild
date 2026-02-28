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
    }
  }
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

    // 增加官方库存
    await GameOfficialMarketStock.findOneAndUpdate(
      { key: 'global' },
      { $inc: { [crystalType]: quantity } },
      { upsert: true }
    )

    return { goldEarned: totalGold, quantity }
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

// ==================== 自由市场 - 素材交易 ====================

/**
 * 获取素材出售列表
 */
export async function listMaterialSellOrders({
  page = 1,
  pageSize = 20,
  materialType,
  excludeAccountId
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
  if (excludeAccountId) filter.account = { $ne: excludeAccountId }
  const total = await GameMarketListing.countDocuments(filter)
  const list = await GameMarketListing.find(filter)
    .sort({ unitPrice: 1, createdAt: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate('account', 'email')
    .lean()

  // 添加公会名
  const GamePlayerInfoModel = (await import('../../models/gamePlayerInfos.js'))
    .default
  const accountIds = list.map(item => item.account?._id || item.account)
  const infos = await GamePlayerInfoModel.find({ account: { $in: accountIds } })
    .select('account guildName')
    .lean()
  const infoMap = new Map()
  for (const info of infos) {
    infoMap.set(info.account.toString(), info.guildName)
  }
  for (const item of list) {
    const accId = item.account?._id?.toString() || item.account?.toString()
    item.guildName = infoMap.get(accId) || '未知'
    // 隐藏邮箱
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
  excludeAccountId
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
  if (excludeAccountId) filter.account = { $ne: excludeAccountId }
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
    item.guildName = infoMap.get(item.account.toString()) || '未知'
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

    return order
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

    return order
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

    // 给买家素材
    await GamePlayerInventory.findOneAndUpdate(
      { account: buyerAccountId },
      { $inc: { [order.materialType]: buyQty } },
      { upsert: true }
    )

    // 给卖家金币
    await GamePlayerInfo.updateOne(
      { account: order.account },
      { $inc: { gold: totalCost } }
    )

    // 更新订单
    if (buyQty >= order.quantity) {
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
  return await executeInLock(`market-fulfill:${orderId}`, async () => {
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

    // 给卖家金币（求购者下单时已扣除金币）
    await GamePlayerInfo.updateOne(
      { account: sellerAccountId },
      { $inc: { gold: totalGold } }
    )

    // 给求购者素材
    await GamePlayerInventory.findOneAndUpdate(
      { account: order.account },
      { $inc: { [order.materialType]: sellQty } },
      { upsert: true }
    )

    // 更新订单
    if (sellQty >= order.quantity) {
      order.status = 'completed'
    } else {
      order.quantity -= sellQty
      // 退还多冻结的金币给求购者（差额部分）
      // 不需要，因为金币按买入量立即结算给卖家
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
      // 出售单：退回素材
      await GamePlayerInventory.findOneAndUpdate(
        { account: accountId },
        { $inc: { [order.materialType]: order.quantity } },
        { upsert: true }
      )
    } else {
      // 求购单：退回金币
      const totalGold = order.unitPrice * order.quantity
      await GamePlayerInfo.updateOne(
        { account: accountId },
        { $inc: { gold: totalGold } }
      )
    }

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
  excludeAccountId
} = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const validRarities = ['normal', 'rare', 'legendary']
  if (rarity && !validRarities.includes(rarity)) rarity = undefined
  const filter = { status: 'active' }
  if (excludeAccountId) filter.account = { $ne: excludeAccountId }
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
    item.guildName = infoMap.get(item.account.toString()) || '未知'
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

    return listing
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

    // 给卖家金币
    await GamePlayerInfo.updateOne(
      { account: listing.account },
      { $inc: { gold: listing.price } }
    )

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
    .populate('runeStone')
    .lean()

  return { list, total }
}
