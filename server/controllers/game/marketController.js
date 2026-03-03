import * as marketService from '../../services/game/marketService.js'

// ========== 官方市场 ==========

export async function getOfficialMarketInfo(req, res, next) {
  try {
    const result = await marketService.getOfficialMarketInfo()
    res.success(result, '获取官方市场信息成功')
  } catch (error) {
    next(error)
  }
}

export async function sellCrystalToOfficial(req, res, next) {
  try {
    const accountId = req.player.id
    const { crystalType, quantity } = req.body
    const result = await marketService.sellCrystalToOfficial(
      accountId,
      crystalType,
      parseInt(quantity)
    )
    res.success(result, '出售成功')
  } catch (error) {
    next(error)
  }
}

export async function buyCrystalFromOfficial(req, res, next) {
  try {
    const accountId = req.player.id
    const { crystalType, quantity } = req.body
    const result = await marketService.buyCrystalFromOfficial(
      accountId,
      crystalType,
      parseInt(quantity)
    )
    res.success(result, '购买成功')
  } catch (error) {
    next(error)
  }
}

export async function sellRuneStoneToOfficial(req, res, next) {
  try {
    const accountId = req.player.id
    const { runeStoneId } = req.body
    const result = await marketService.sellRuneStoneToOfficial(
      accountId,
      runeStoneId
    )
    res.success(result, '出售成功')
  } catch (error) {
    next(error)
  }
}

export async function sellRuneFragmentToOfficial(req, res, next) {
  try {
    const accountId = req.player.id
    const { quantity } = req.body
    const result = await marketService.sellRuneFragmentToOfficial(
      accountId,
      parseInt(quantity)
    )
    res.success(result, '出售成功')
  } catch (error) {
    next(error)
  }
}

// ========== 素材交易 ==========

export async function listMaterialSellOrders(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize, materialType } = req.query
    const result = await marketService.listMaterialSellOrders({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      materialType,
      excludeAccountId: accountId
    })
    res.success(result, '获取出售列表成功')
  } catch (error) {
    next(error)
  }
}

export async function listMaterialBuyOrders(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize, materialType } = req.query
    const result = await marketService.listMaterialBuyOrders({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      materialType,
      excludeAccountId: accountId
    })
    res.success(result, '获取求购列表成功')
  } catch (error) {
    next(error)
  }
}

export async function createMaterialSellOrder(req, res, next) {
  try {
    const accountId = req.player.id
    const { materialType, quantity, unitPrice } = req.body
    const result = await marketService.createMaterialSellOrder(
      accountId,
      materialType,
      parseInt(quantity),
      parseInt(unitPrice)
    )
    res.success(result, '出售订单创建成功')
  } catch (error) {
    next(error)
  }
}

export async function createMaterialBuyOrder(req, res, next) {
  try {
    const accountId = req.player.id
    const { materialType, quantity, unitPrice } = req.body
    const result = await marketService.createMaterialBuyOrder(
      accountId,
      materialType,
      parseInt(quantity),
      parseInt(unitPrice)
    )
    res.success(result, '求购订单创建成功')
  } catch (error) {
    next(error)
  }
}

export async function fulfillMaterialSellOrder(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { quantity } = req.body
    const result = await marketService.fulfillMaterialSellOrder(
      accountId,
      id,
      quantity ? parseInt(quantity) : undefined
    )
    res.success(result, '购买成功')
  } catch (error) {
    next(error)
  }
}

export async function fulfillMaterialBuyOrder(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { quantity } = req.body
    const result = await marketService.fulfillMaterialBuyOrder(
      accountId,
      id,
      quantity ? parseInt(quantity) : undefined
    )
    res.success(result, '出售成功')
  } catch (error) {
    next(error)
  }
}

export async function cancelMaterialOrder(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await marketService.cancelMaterialOrder(accountId, id)
    res.success(result, '已下架')
  } catch (error) {
    next(error)
  }
}

export async function listMyMaterialOrders(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize, orderType, status } = req.query
    const result = await marketService.listMyMaterialOrders(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      orderType,
      status
    })
    res.success(result, '获取我的订单成功')
  } catch (error) {
    next(error)
  }
}

// ========== 符文石交易 ==========

export async function listRuneStoneListings(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize, rarity } = req.query
    const result = await marketService.listRuneStoneListings({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      rarity,
      excludeAccountId: accountId
    })
    res.success(result, '获取符文石列表成功')
  } catch (error) {
    next(error)
  }
}

export async function createRuneStoneListing(req, res, next) {
  try {
    const accountId = req.player.id
    const { runeStoneId, price } = req.body
    const result = await marketService.createRuneStoneListing(
      accountId,
      runeStoneId,
      parseInt(price)
    )
    res.success(result, '上架成功')
  } catch (error) {
    next(error)
  }
}

export async function buyRuneStoneListing(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await marketService.buyRuneStoneListing(accountId, id)
    res.success(result, '购买成功')
  } catch (error) {
    next(error)
  }
}

export async function cancelRuneStoneListing(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await marketService.cancelRuneStoneListing(accountId, id)
    res.success(result, '已下架')
  } catch (error) {
    next(error)
  }
}

export async function listMyRuneStoneListings(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize, status } = req.query
    const result = await marketService.listMyRuneStoneListings(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      status
    })
    res.success(result, '获取我的挂单成功')
  } catch (error) {
    next(error)
  }
}

// ========== 收取 ==========

export async function collectMaterialOrder(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await marketService.collectMaterialOrder(accountId, id)
    res.success(result, '收取成功')
  } catch (error) {
    next(error)
  }
}

export async function collectRuneStoneListing(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await marketService.collectRuneStoneListing(accountId, id)
    res.success(result, '收取成功')
  } catch (error) {
    next(error)
  }
}
