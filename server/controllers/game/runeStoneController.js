import * as runeStoneService from '../../services/game/runeStoneService.js'

/**
 * 获取我的符文石列表
 */
export async function listMyRuneStones(req, res, next) {
  try {
    const accountId = req.player.id
    const {
      page,
      pageSize,
      rarity,
      equipped,
      listed,
      sort,
      skillFilters,
      buffFilters
    } = req.query

    // 解析 skillFilters 和 buffFilters（JSON 字符串）
    let parsedSkillFilters = null
    let parsedBuffFilters = null
    const validModes = ['and', 'or', 'not']
    const validSkillTypes = [
      'attack',
      'buff',
      'debuff',
      'changeOrder',
      'sanRecover'
    ]
    const validBuffTypes = ['attack', 'defense', 'speed', 'san']
    if (skillFilters) {
      try {
        const arr = JSON.parse(skillFilters)
        if (Array.isArray(arr)) {
          parsedSkillFilters = arr.filter(
            f =>
              f &&
              validModes.includes(f.mode) &&
              validSkillTypes.includes(f.type)
          )
          if (parsedSkillFilters.length === 0) parsedSkillFilters = null
        }
      } catch {
        // ignore
      }
    }
    if (buffFilters) {
      try {
        const arr = JSON.parse(buffFilters)
        if (Array.isArray(arr)) {
          parsedBuffFilters = arr.filter(
            f =>
              f &&
              validModes.includes(f.mode) &&
              validBuffTypes.includes(f.type)
          )
          if (parsedBuffFilters.length === 0) parsedBuffFilters = null
        }
      } catch {
        // ignore
      }
    }

    const result = await runeStoneService.listMyRuneStones(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      rarity,
      equipped,
      listed,
      sort,
      skillFilters: parsedSkillFilters,
      buffFilters: parsedBuffFilters
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
 * 批量分解符文石
 */
export async function batchDecomposeRuneStones(req, res, next) {
  try {
    const accountId = req.player.id
    const { runeStoneIds } = req.body
    const result = await runeStoneService.batchDecomposeRuneStones(
      accountId,
      runeStoneIds
    )
    res.success(result, '批量分解完成')
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
