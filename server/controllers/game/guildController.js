import * as guildService from '../../services/game/guildService.js'

/**
 * 修改公会标志
 */
export async function changeGuildLogo(req, res, next) {
  try {
    const { logo } = req.body
    if (!logo) {
      return res.badRequest('请提供标志图片')
    }
    const result = await guildService.changeGuildLogo(req.player.id, logo)
    res.success(result, '公会标志修改成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改公会名字
 */
export async function changeGuildName(req, res, next) {
  try {
    const { name } = req.body
    if (!name || typeof name !== 'string') {
      return res.badRequest('请提供公会名')
    }
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 8) {
      return res.badRequest('公会名长度需要在2-8个字符之间')
    }
    const result = await guildService.changeGuildName(
      req.player.id,
      trimmedName
    )
    res.success(result, '公会名修改成功')
  } catch (error) {
    next(error)
  }
}
