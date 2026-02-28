import * as legionService from '../../services/game/legionService.js'

/**
 * 预览军团恶魔
 */
export async function previewLegion(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await legionService.previewLegion(accountId)
    res.success(result, '获取军团信息成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 挑战军团
 */
export async function challengeLegion(req, res, next) {
  try {
    const accountId = req.player.id
    const { formationSlot } = req.body
    if (!formationSlot) {
      return res.paramError('请选择出战阵容')
    }
    const slotNum = parseInt(formationSlot)
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 10) {
      return res.paramError('无效的阵容槽位')
    }
    const result = await legionService.challengeLegion(accountId, slotNum)
    res.success(result, '挑战完成')
  } catch (error) {
    next(error)
  }
}
