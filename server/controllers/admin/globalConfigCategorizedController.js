import * as globalConfigService from '../../services/admin/globalConfigService.js'

/**
 * 获取站点设置
 */
export async function getSiteSettings(req, res, next) {
  try {
    const data = await globalConfigService.getSiteSettings()
    res.success(data)
  } catch (error) {
    next(error)
  }
}

/**
 * 更新站点设置
 */
export async function updateSiteSettings(req, res, next) {
  try {
    const data = await globalConfigService.updateSiteSettings(req.body)
    res.success(data, '站点设置已保存')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取邮箱设置
 */
export async function getEmailSettings(req, res, next) {
  try {
    const data = await globalConfigService.getEmailSettings()
    res.success(data)
  } catch (error) {
    next(error)
  }
}

/**
 * 更新邮箱设置
 */
export async function updateEmailSettings(req, res, next) {
  try {
    const data = await globalConfigService.updateEmailSettings(req.body)
    res.success(data, '邮箱设置已保存')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取安全设置
 */
export async function getSecuritySettings(req, res, next) {
  try {
    const data = await globalConfigService.getSecuritySettings()
    res.success(data)
  } catch (error) {
    next(error)
  }
}

/**
 * 更新安全设置
 */
export async function updateSecuritySettings(req, res, next) {
  try {
    const data = await globalConfigService.updateSecuritySettings(req.body)
    res.success(data, '安全设置已保存')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取广告设置
 */
export async function getAdSettings(req, res, next) {
  try {
    const data = await globalConfigService.getAdSettings()
    res.success(data)
  } catch (error) {
    next(error)
  }
}

/**
 * 更新广告设置
 */
export async function updateAdSettings(req, res, next) {
  try {
    const data = await globalConfigService.updateAdSettings(req.body)
    res.success(data, '广告设置已保存')
  } catch (error) {
    next(error)
  }
}
