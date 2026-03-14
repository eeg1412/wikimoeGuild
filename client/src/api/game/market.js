import gameRequest from './request.js'

// 官方市场
export function getOfficialMarketInfoApi() {
  return gameRequest.get('/market/official/info')
}

export function sellCrystalToOfficialApi(data) {
  return gameRequest.post('/market/official/sell', data)
}

export function smartSellCrystalApi(data) {
  return gameRequest.post('/market/official/smart-sell', data)
}

export function getCrystalBuyPriceRangeApi() {
  return gameRequest.get('/market/official/crystal-price-range')
}

export function buyCrystalFromOfficialApi(data) {
  return gameRequest.post('/market/official/buy', data)
}

// 官方市场 - 出售符文石
export function sellRuneStoneToOfficialApi(data) {
  return gameRequest.post('/market/official/sell-rune-stone', data)
}

// 官方市场 - 批量出售符文石
export function batchSellRuneStonesToOfficialApi(data) {
  return gameRequest.post('/market/official/batch-sell-rune-stone', data)
}

// 素材交易 - 出售列表
export function listMaterialSellOrdersApi(params) {
  return gameRequest.get('/market/material/sell-orders', { params })
}

// 素材交易 - 求购列表
export function listMaterialBuyOrdersApi(params) {
  return gameRequest.get('/market/material/buy-orders', { params })
}

// 素材交易 - 发布出售
export function createMaterialSellOrderApi(data) {
  return gameRequest.post('/market/material/sell', data)
}

// 素材交易 - 发布求购
export function createMaterialBuyOrderApi(data) {
  return gameRequest.post('/market/material/buy', data)
}

// 素材交易 - 购买卖单
export function fulfillMaterialSellOrderApi(id, data) {
  return gameRequest.post(`/market/material/sell-orders/${id}/fulfill`, data)
}

// 素材交易 - 出售给求购
export function fulfillMaterialBuyOrderApi(id, data) {
  return gameRequest.post(`/market/material/buy-orders/${id}/fulfill`, data)
}

// 素材交易 - 取消
export function cancelMaterialOrderApi(id) {
  return gameRequest.post(`/market/material/${id}/cancel`)
}

// 素材交易 - 我的订单
export function listMyMaterialOrdersApi(params) {
  return gameRequest.get('/market/material/my-orders', { params })
}

// 符文石交易 - 列表
export function listRuneStoneListingsApi(params) {
  return gameRequest.get('/market/rune-stone/listings', { params })
}

// 符文石交易 - 上架
export function createRuneStoneListingApi(data) {
  return gameRequest.post('/market/rune-stone/list', data)
}

// 符文石交易 - 购买
export function buyRuneStoneListingApi(id) {
  return gameRequest.post(`/market/rune-stone/${id}/buy`)
}

// 符文石交易 - 下架
export function cancelRuneStoneListingApi(id) {
  return gameRequest.post(`/market/rune-stone/${id}/cancel`)
}

// 符文石交易 - 我的挂单
export function listMyRuneStoneListingsApi(params) {
  return gameRequest.get('/market/rune-stone/my-listings', { params })
}

// 素材交易 - 收取待领取物品
export function collectMaterialOrderApi(id) {
  return gameRequest.post(`/market/material/${id}/collect`)
}

// 符文石交易 - 收取待领取金币
export function collectRuneStoneListingApi(id) {
  return gameRequest.post(`/market/rune-stone/${id}/collect`)
}

// 官方市场 - 出售符文石碎片
export function sellRuneFragmentToOfficialApi(data) {
  return gameRequest.post('/market/official/sell-rune-fragment', data)
}
