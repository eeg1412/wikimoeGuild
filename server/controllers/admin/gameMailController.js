import * as gameMailService from '../../services/admin/gameMailService.js'

/**
 * 管理后台发送邮件
 */
export async function sendMail(req, res, next) {
  try {
    const { title, content, sendTo, playerIds, attachGold, attachItems } =
      req.body
    const result = await gameMailService.sendAdminMail({
      title,
      content,
      sendTo,
      playerIds,
      attachGold: parseInt(attachGold) || 0,
      attachItems: attachItems || {}
    })
    res.success(
      result,
      `邮件发送完成，成功 ${result.successCount}/${result.totalTargets}`
    )
  } catch (error) {
    next(error)
  }
}
