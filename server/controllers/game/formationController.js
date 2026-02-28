import * as formationService from '../../services/game/formationService.js'

/**
 * 获取我的阵容列表
 */
export async function listMyFormations(req, res, next) {
  try {
    const accountId = req.player.id
    const formations = await formationService.listMyFormations(accountId)
    res.success(formations, '获取阵容列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取阵容详情
 */
export async function getFormationDetail(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await formationService.getFormationDetail(accountId, id)
    res.success(result, '获取阵容详情成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 保存阵容
 */
export async function saveFormation(req, res, next) {
  try {
    const accountId = req.player.id
    const { slot, name, grid } = req.body
    if (!slot) {
      return res.paramError('请指定阵容槽位')
    }
    const slotNum = parseInt(slot)
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 10) {
      return res.paramError('阵容槽位必须在1-10之间')
    }
    if (!grid || !Array.isArray(grid)) {
      return res.paramError('请提供阵容棋盘数据')
    }
    const result = await formationService.saveFormation(
      accountId,
      slotNum,
      name,
      grid
    )
    res.success(result, '保存成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 删除阵容
 */
export async function deleteFormation(req, res, next) {
  try {
    const accountId = req.player.id
    const { slot } = req.params
    const slotNum = parseInt(slot)
    if (isNaN(slotNum)) {
      return res.paramError('无效的阵容槽位')
    }
    await formationService.deleteFormation(accountId, slotNum)
    res.success(null, '删除成功')
  } catch (error) {
    next(error)
  }
}
