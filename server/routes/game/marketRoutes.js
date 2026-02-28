import { Router } from 'express'
import * as marketController from '../../controllers/game/marketController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

// 官方市场
router.get('/official/info', authPlayer, marketController.getOfficialMarketInfo)
router.post(
  '/official/sell',
  authPlayer,
  marketController.sellCrystalToOfficial
)
router.post(
  '/official/buy',
  authPlayer,
  marketController.buyCrystalFromOfficial
)

// 素材交易 - 浏览
router.get(
  '/material/sell-orders',
  authPlayer,
  marketController.listMaterialSellOrders
)
router.get(
  '/material/buy-orders',
  authPlayer,
  marketController.listMaterialBuyOrders
)

// 素材交易 - 发布
router.post(
  '/material/sell',
  authPlayer,
  marketController.createMaterialSellOrder
)
router.post(
  '/material/buy',
  authPlayer,
  marketController.createMaterialBuyOrder
)

// 素材交易 - 成交
router.post(
  '/material/sell-orders/:id/fulfill',
  authPlayer,
  marketController.fulfillMaterialSellOrder
)
router.post(
  '/material/buy-orders/:id/fulfill',
  authPlayer,
  marketController.fulfillMaterialBuyOrder
)

// 素材交易 - 取消/下架
router.post(
  '/material/:id/cancel',
  authPlayer,
  marketController.cancelMaterialOrder
)

// 素材交易 - 我的订单
router.get(
  '/material/my-orders',
  authPlayer,
  marketController.listMyMaterialOrders
)

// 符文石交易 - 浏览
router.get(
  '/rune-stone/listings',
  authPlayer,
  marketController.listRuneStoneListings
)

// 符文石交易 - 发布
router.post(
  '/rune-stone/list',
  authPlayer,
  marketController.createRuneStoneListing
)

// 符文石交易 - 购买
router.post(
  '/rune-stone/:id/buy',
  authPlayer,
  marketController.buyRuneStoneListing
)

// 符文石交易 - 下架
router.post(
  '/rune-stone/:id/cancel',
  authPlayer,
  marketController.cancelRuneStoneListing
)

// 符文石交易 - 我的挂单
router.get(
  '/rune-stone/my-listings',
  authPlayer,
  marketController.listMyRuneStoneListings
)

export default router
