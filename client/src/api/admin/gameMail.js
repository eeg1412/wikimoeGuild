import adminRequest from './request.js'

/**
 * 管理后台发送邮件
 */
export function sendAdminMailApi(data) {
  return adminRequest.post('/game-mails/send', data)
}
