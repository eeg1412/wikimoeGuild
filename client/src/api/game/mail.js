import gameRequest from './request.js'

export function getMailListApi(params) {
  return gameRequest.get('/mail/list', { params })
}

export function getMailDetailApi(id) {
  return gameRequest.get(`/mail/${id}`)
}

export function claimMailAttachmentApi(id) {
  return gameRequest.post(`/mail/${id}/claim`)
}

export function deleteMailApi(id) {
  return gameRequest.delete(`/mail/${id}`)
}

export function getUnreadCountApi() {
  return gameRequest.get('/mail/unread-count')
}
