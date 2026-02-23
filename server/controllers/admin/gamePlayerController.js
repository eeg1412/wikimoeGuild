import * as gamePlayerService from '../../services/admin/gamePlayerService.js'
import * as gamePlayerBanService from '../../services/admin/gamePlayerBanService.js'

export async function list(req, res, next) {
  try {
    const result = await gamePlayerService.list(req.query)
    res.success(result, '获取玩家列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 封禁玩家
 */
export async function banPlayer(req, res, next) {
  try {
    const { email, banExpires } = req.body
    if (!email || !banExpires) {
      return res.paramError('请提供邮箱和封禁到期时间')
    }
    await gamePlayerBanService.banPlayer(email, banExpires)
    res.success(null, '封禁成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改玩家密码
 */
export async function changePlayerPassword(req, res, next) {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    if (!newPassword) {
      return res.paramError('请提供新密码')
    }
    await gamePlayerBanService.changePlayerPassword(id, newPassword)
    res.success(null, '密码修改成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取封禁记录列表
 */
export async function listBanLogs(req, res, next) {
  try {
    const result = await gamePlayerBanService.listBanLogs(req.query)
    res.success(result, '获取封禁记录成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 删除封禁记录（解除封禁）
 */
export async function deleteBanLog(req, res, next) {
  try {
    await gamePlayerBanService.deleteBanLog(req.params.id)
    res.success(null, '封禁已解除')
  } catch (error) {
    next(error)
  }
}
