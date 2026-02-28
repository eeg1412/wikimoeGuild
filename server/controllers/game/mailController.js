import * as mailService from '../../services/game/mailService.js'

export async function listMails(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize } = req.query
    const result = await mailService.listMails(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20
    })
    res.success(result, '获取邮件列表成功')
  } catch (error) {
    next(error)
  }
}

export async function getMailDetail(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await mailService.getMailDetail(accountId, id)
    res.success(result, '获取邮件详情成功')
  } catch (error) {
    next(error)
  }
}

export async function claimMailAttachment(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await mailService.claimMailAttachment(accountId, id)
    res.success(result, '附件领取成功')
  } catch (error) {
    next(error)
  }
}

export async function deleteMail(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await mailService.deleteMail(accountId, id)
    res.success(result, '邮件已删除')
  } catch (error) {
    next(error)
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await mailService.getUnreadCount(accountId)
    res.success(result, '获取未读数成功')
  } catch (error) {
    next(error)
  }
}
