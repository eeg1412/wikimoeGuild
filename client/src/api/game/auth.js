import gameRequest from './request.js'

/**
 * 发送邮箱验证码
 * @param {{ email: string, type: 'register'|'resetPassword' }} data
 */
export function sendCodeApi(data) {
  return gameRequest.post('/auth/send-code', data)
}

/**
 * 玩家注册
 * @param {{ email: string, password: string, guildName: string, code: string }} data
 */
export function registerApi(data) {
  return gameRequest.post('/auth/register', data)
}

/**
 * 玩家登录
 * @param {{ email: string, password: string, rememberMe?: boolean }} data
 */
export function loginApi(data) {
  return gameRequest.post('/auth/login', data)
}

/**
 * 刷新玩家 Token
 * @param {{ refreshToken: string }} data
 */
export function refreshPlayerTokenApi(data) {
  return gameRequest.post('/auth/refresh', data)
}

/**
 * 重置密码
 * @param {{ email: string, code: string, newPassword: string }} data
 */
export function resetPasswordApi(data) {
  return gameRequest.post('/auth/reset-password', data)
}

/**
 * 获取当前登录玩家信息
 */
export function getMeApi() {
  return gameRequest.get('/auth/me')
}

/**
 * 玩家修改密码
 * @param {{ currentPassword: string, newPassword: string }} data
 */
export function changePasswordApi(data) {
  return gameRequest.post('/auth/change-password', data)
}

/**
 * 获取游客模式配置
 */
export function getGuestConfigApi() {
  return gameRequest.get('/auth/guest-config')
}

/**
 * 游客注册
 */
export function guestRegisterApi() {
  return gameRequest.post('/auth/guest-register', {})
}

/**
 * 游客绑定邮箱 - 发送验证码
 * @param {{ email: string }} data
 */
export function guestBindEmailSendCodeApi(data) {
  return gameRequest.post('/auth/guest-bind-email/send-code', data)
}

/**
 * 游客绑定邮箱
 * @param {{ email: string, code: string }} data
 */
export function guestBindEmailApi(data) {
  return gameRequest.post('/auth/guest-bind-email', data)
}
