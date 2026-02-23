import * as authService from '../../services/game/authService.js'

/**
 * 发送邮箱验证码
 */
export async function sendCode(req, res, next) {
  try {
    const { email, type } = req.body
    await authService.sendMailCode(req, email, type || 'register')
    res.success(null, '验证码已发送，请查收邮件')
  } catch (error) {
    next(error)
  }
}

/**
 * 玩家注册
 */
export async function register(req, res, next) {
  try {
    const result = await authService.register(req, req.body)
    res.success(result, '注册成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 玩家登录
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req, req.body)
    res.success(result, '登录成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 重置密码
 */
export async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req, req.body)
    res.success(null, '密码重置成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取当前登录玩家信息
 */
export async function getMe(req, res, next) {
  try {
    const playerInfo = await authService.getPlayerInfo(req.player.id)
    res.success(playerInfo, '获取成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 刷新玩家 Token
 */
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.unauthorized('请提供刷新令牌')
    }
    const result = await authService.refreshPlayerToken(refreshToken)
    res.success(result, '令牌刷新成功')
  } catch (error) {
    next(error)
  }
}
