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

/**
 * 玩家修改密码
 */
export async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.player.id, req.body)
    res.success(null, '密码修改成功，请重新登录')
  } catch (error) {
    next(error)
  }
}

/**
 * 游客注册
 */
export async function guestRegister(req, res, next) {
  try {
    const result = await authService.guestRegister(req)
    res.success(result, '游客注册成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 游客绑定邮箱 - 发送验证码
 */
export async function guestBindEmailSendCode(req, res, next) {
  try {
    const { email } = req.body
    await authService.guestBindEmailSendCode(req, email)
    res.success(null, '验证码已发送，请查收邮件')
  } catch (error) {
    next(error)
  }
}

/**
 * 游客绑定邮箱
 */
export async function guestBindEmail(req, res, next) {
  try {
    const result = await authService.guestBindEmail(req.player.id, req.body)
    res.success(result, '邮箱绑定成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取游客模式配置
 */
export async function getGuestConfig(req, res, next) {
  try {
    const config = authService.getGuestConfig()
    res.success(config, '获取成功')
  } catch (error) {
    next(error)
  }
}
