/**
 * 获取游戏前端所需的全局配置（siteSettings）
 */
export async function getSiteSettings(req, res, next) {
  try {
    const siteSettings = global.$globalConfig?.siteSettings || {}
    res.success(siteSettings, '获取成功')
  } catch (error) {
    next(error)
  }
}
