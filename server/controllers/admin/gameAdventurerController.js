import * as gameAdventurerService from '../../services/admin/gameAdventurerService.js'

/**
 * 冒险家列表
 */
export async function list(req, res, next) {
  try {
    const result = await gameAdventurerService.list(req.query)
    res.success(result, '获取冒险家列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改冒险家名字
 */
export async function rename(req, res, next) {
  try {
    const { id } = req.params
    const { name } = req.body
    if (!name || name.trim().length < 2 || name.trim().length > 20) {
      return res.paramError('名字长度为 2-20 个字符')
    }
    await gameAdventurerService.rename(id, name.trim())
    res.success(null, '改名成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 重置冒险家头像为默认
 */
export async function resetAvatar(req, res, next) {
  try {
    const { id } = req.params
    await gameAdventurerService.resetAvatar(id)
    res.success(null, '头像已重置为默认')
  } catch (error) {
    next(error)
  }
}
