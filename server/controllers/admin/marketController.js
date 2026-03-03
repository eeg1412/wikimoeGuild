import * as marketService from '../../services/game/marketService.js'

/**
 * 获取官方市场库存
 */
export async function getOfficialMarketStock(req, res, next) {
  try {
    const result = await marketService.getOfficialMarketStock()
    res.success(result, '获取库存成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 设置官方市场库存
 */
export async function updateOfficialMarketStock(req, res, next) {
  try {
    const result = await marketService.updateOfficialMarketStock(req.body)
    res.success(result, '库存更新成功')
  } catch (error) {
    next(error)
  }
}
