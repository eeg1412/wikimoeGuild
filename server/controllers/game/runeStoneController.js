import * as runeStoneService from '../../services/game/runeStoneService.js'

/**
 * 获取我的符文石列表
 */
export async function listMyRuneStones(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize, rarity, equipped } = req.query
    const result = await runeStoneService.listMyRuneStones(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      rarity,
      equipped
    })
    res.success(result, '获取符文石列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取符文石详情
 */
export async function getRuneStoneDetail(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await runeStoneService.getRuneStoneDetail(accountId, id)
    res.success(result, '获取符文石详情成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 分解符文石
 */
export async function decomposeRuneStone(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await runeStoneService.decomposeRuneStone(accountId, id)
    res.success(result, '分解成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 升级符文石
 */
export async function upgradeRuneStone(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await runeStoneService.upgradeRuneStone(accountId, id)
    res.success(result, '升级成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 符文石合成预览
 */
export async function previewSynthesis(req, res, next) {
  try {
    const accountId = req.player.id
    const { mainRuneStoneId, materialRuneStoneId } = req.body
    const result = await runeStoneService.previewSynthesis(
      accountId,
      mainRuneStoneId,
      materialRuneStoneId
    )
    res.success(result, '合成预览成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 确认符文石合成
 */
export async function confirmSynthesis(req, res, next) {
  try {
    const accountId = req.player.id
    const { previewToken, accept } = req.body
    if (!previewToken) {
      return res.paramError('缺少预览令牌')
    }
    const result = await runeStoneService.confirmSynthesis(
      accountId,
      previewToken,
      accept === true
    )
    res.success(result, accept ? '合成成功' : '已放弃合成，素材符文石已销毁')
  } catch (error) {
    next(error)
  }
}
