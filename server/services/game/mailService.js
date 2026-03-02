import GamePlayerMail from '../../models/gamePlayerMail.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'
import GamePlayerInventory from '../../models/gamePlayerInventory.js'
import GameRuneStone from '../../models/gameRuneStone.js'
import { executeInLock } from '../../utils/utils.js'

/**
 * 发送邮件（系统调用）
 */
export async function sendMail(
  accountId,
  {
    title,
    content = '',
    type = 'system',
    attachGold = 0,
    attachItems = {},
    attachRuneStoneIds = []
  }
) {
  const hasAttachment =
    attachGold > 0 ||
    Object.values(attachItems).some(v => v > 0) ||
    attachRuneStoneIds.length > 0

  const mail = await GamePlayerMail.create({
    account: accountId,
    title,
    content,
    type,
    attachGold,
    attachItems: {
      attackCrystal: attachItems.attackCrystal || 0,
      defenseCrystal: attachItems.defenseCrystal || 0,
      speedCrystal: attachItems.speedCrystal || 0,
      sanCrystal: attachItems.sanCrystal || 0,
      runeFragment: attachItems.runeFragment || 0
    },
    attachRuneStones: attachRuneStoneIds,
    hasAttachment,
    claimed: !hasAttachment
  })

  return mail
}

/**
 * 获取邮件列表
 */
export async function listMails(accountId, { page = 1, pageSize = 20 } = {}) {
  pageSize = Math.min(Math.max(pageSize, 1), 50)
  const filter = { account: accountId }
  const total = await GamePlayerMail.countDocuments(filter)
  const list = await GamePlayerMail.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('-account')
    .lean()
  const unreadCount = await GamePlayerMail.countDocuments({
    ...filter,
    read: false
  })
  return { list, total, unreadCount }
}

/**
 * 获取邮件详情
 */
export async function getMailDetail(accountId, mailId) {
  const mail = await GamePlayerMail.findOne({
    _id: mailId,
    account: accountId
  })
    .populate('attachRuneStones')
    .lean()
  if (!mail) {
    const err = new Error('邮件不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  // 标记为已读
  if (!mail.read) {
    await GamePlayerMail.updateOne({ _id: mailId }, { read: true })
  }
  // 禁止返回 account ObjectId
  delete mail.account
  return mail
}

/**
 * 领取邮件附件
 */
export async function claimMailAttachment(accountId, mailId) {
  return await executeInLock(`mail-claim:${accountId}`, async () => {
    const mail = await GamePlayerMail.findOne({
      _id: mailId,
      account: accountId
    })
    if (!mail) {
      const err = new Error('邮件不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }
    if (!mail.hasAttachment) {
      const err = new Error('此邮件没有附件')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    if (mail.claimed) {
      const err = new Error('附件已领取')
      err.statusCode = 400
      err.expose = true
      throw err
    }

    // 发放金币
    if (mail.attachGold > 0) {
      await GamePlayerInfo.updateOne(
        { account: accountId },
        { $inc: { gold: mail.attachGold } }
      )
    }

    // 发放物品
    const itemInc = {}
    if (mail.attachItems.attackCrystal > 0)
      itemInc.attackCrystal = mail.attachItems.attackCrystal
    if (mail.attachItems.defenseCrystal > 0)
      itemInc.defenseCrystal = mail.attachItems.defenseCrystal
    if (mail.attachItems.speedCrystal > 0)
      itemInc.speedCrystal = mail.attachItems.speedCrystal
    if (mail.attachItems.sanCrystal > 0)
      itemInc.sanCrystal = mail.attachItems.sanCrystal
    if (mail.attachItems.runeFragment > 0)
      itemInc.runeFragment = mail.attachItems.runeFragment

    if (Object.keys(itemInc).length > 0) {
      await GamePlayerInventory.findOneAndUpdate(
        { account: accountId },
        { $inc: itemInc },
        { upsert: true }
      )
    }

    // 发放符文石 - 将符文石归属转移给玩家
    if (mail.attachRuneStones && mail.attachRuneStones.length > 0) {
      await GameRuneStone.updateMany(
        { _id: { $in: mail.attachRuneStones } },
        { account: accountId, equippedBy: null }
      )
    }

    // 标记已领取已读
    mail.claimed = true
    mail.read = true
    await mail.save()

    return { success: true }
  })
}

/**
 * 删除邮件
 */
export async function deleteMail(accountId, mailId) {
  return await executeInLock(`mail-delete:${accountId}`, async () => {
    const mail = await GamePlayerMail.findOne({
      _id: mailId,
      account: accountId
    })
    if (!mail) {
      const err = new Error('邮件不存在')
      err.statusCode = 404
      err.expose = true
      throw err
    }
    if (mail.hasAttachment && !mail.claimed) {
      const err = new Error('请先领取附件后再删除邮件')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    await GamePlayerMail.deleteOne({ _id: mailId })
    return { success: true }
  })
}

/**
 * 获取未读邮件数
 */
export async function getUnreadCount(accountId) {
  const count = await GamePlayerMail.countDocuments({
    account: accountId,
    read: false
  })
  return { unreadCount: count }
}
