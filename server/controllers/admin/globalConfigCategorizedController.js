import * as globalConfigService from '../../services/admin/globalConfigService.js'
import { sendMail } from '../../utils/mailer.js'

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

/**
 * 测试邮件连接
 * 使用当前邮箱配置发送一封测试邮件到指定收件人
 */
export async function testEmailConnection(req, res, next) {
  try {
    const { to } = req.body
    if (!to) {
      return res.paramError('请提供收件邮箱')
    }
    const siteTitle =
      global.$globalConfig?.siteSettings?.siteTitle || 'WikimoeGuild'
    await sendMail({
      to,
      subject: `【${siteTitle}】邮件连接测试`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#374151;margin-bottom:16px;">${siteTitle}</h2>
          <p style="color:#6b7280;">这是一封测试邮件，说明您的邮件服务配置正确。</p>
          <p style="color:#9ca3af;font-size:13px;margin-top:16px;">发送时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `
    })
    res.success(null, '测试邮件发送成功，请查收')
  } catch (error) {
    next(error)
  }
}
