import GlobalConfig from '../../models/globalConfigs.js'
import { initGlobalConfig } from '../../config/globalConfig.js'
import { saveBase64Image } from '../../utils/imageUpload.js'

/**
 * 配置列表
 */
export async function list({ keyword = [] }) {
  const filter = {}
  if (keyword.length > 0) {
    filter.name = { $in: keyword }
  }
  const total = await GlobalConfig.countDocuments(filter)
  const items = await GlobalConfig.find(filter).sort({ createdAt: -1 })
  return { list: items, total }
}

// findOneAndUpdate
export async function findOneAndUpdate(filter, update, options = {}) {
  const res = await GlobalConfig.findOneAndUpdate(filter, update, options)
  return res
}

/**
 * 获取站点设置
 */
export async function getSiteSettings() {
  const config = global.$globalConfig?.siteSettings || {}
  return {
    siteTitle: config.siteTitle || '',
    siteSubTitle: config.siteSubTitle || '',
    siteKeywords: config.siteKeywords || '',
    siteUrl: config.siteUrl || '',
    siteFavicon: config.siteFavicon || ''
  }
}

/**
 * 更新站点设置
 */
export async function updateSiteSettings(data) {
  const configKeys = ['siteTitle', 'siteSubTitle', 'siteKeywords', 'siteUrl']

  // 如果有 Favicon base64，则单独处理
  if (data.siteFavicon && data.siteFavicon.startsWith('data:')) {
    try {
      data.siteFavicon = await saveBase64Image(
        data.siteFavicon,
        'site',
        'favicon.png'
      )
    } catch (e) {
      throw new Error(`Favicon 上传失败: ${e.message}`)
    }
  }

  // 保存所有配置到数据库
  for (const key of configKeys) {
    if (key in data) {
      await GlobalConfig.findOneAndUpdate(
        { name: key },
        { name: key, value: data[key] },
        { upsert: true, new: true }
      )
    }
  }

  // 处理 siteFavicon
  if ('siteFavicon' in data) {
    await GlobalConfig.findOneAndUpdate(
      { name: 'siteFavicon' },
      { name: 'siteFavicon', value: data.siteFavicon },
      { upsert: true, new: true }
    )
  }

  // 重新加载全局配置
  await initGlobalConfig()

  return getSiteSettings()
}

/**
 * 获取邮箱设置
 */
export async function getEmailSettings() {
  const config = global.$globalConfig?.emailSettings || {}
  return {
    emailSmtpHost: config.emailSmtpHost || '',
    emailSmtpPort: config.emailSmtpPort || '',
    emailSmtpSecure:
      config.emailSmtpSecure !== undefined ? config.emailSmtpSecure : true,
    emailSender: config.emailSender || '',
    emailPassword: config.emailPassword || '',
    emailReceiver: config.emailReceiver || ''
  }
}

/**
 * 更新邮箱设置
 */
export async function updateEmailSettings(data) {
  const configKeys = [
    'emailSmtpHost',
    'emailSmtpPort',
    'emailSmtpSecure',
    'emailSender',
    'emailPassword',
    'emailReceiver'
  ]

  for (const key of configKeys) {
    if (key in data) {
      const value =
        typeof data[key] === 'boolean' ? String(data[key]) : data[key]
      await GlobalConfig.findOneAndUpdate(
        { name: key },
        { name: key, value },
        { upsert: true, new: true }
      )
    }
  }

  await initGlobalConfig()
  return getEmailSettings()
}

/**
 * 获取安全设置
 */
export async function getSecuritySettings() {
  const config = global.$globalConfig?.securitySettings || {}
  return {
    siteIPBlockList:
      config.siteIPBlockList instanceof Set
        ? Array.from(config.siteIPBlockList)
        : config.siteIPBlockList || [],
    siteBannedKeywordList: config.siteBannedKeywordList || []
  }
}

/**
 * 更新安全设置
 */
export async function updateSecuritySettings(data) {
  if ('siteIPBlockList' in data) {
    const value = Array.isArray(data.siteIPBlockList)
      ? data.siteIPBlockList.join(',')
      : ''
    await GlobalConfig.findOneAndUpdate(
      { name: 'siteIPBlockList' },
      { name: 'siteIPBlockList', value },
      { upsert: true, new: true }
    )
  }

  if ('siteBannedKeywordList' in data) {
    const value = Array.isArray(data.siteBannedKeywordList)
      ? data.siteBannedKeywordList.join(',')
      : ''
    await GlobalConfig.findOneAndUpdate(
      { name: 'siteBannedKeywordList' },
      { name: 'siteBannedKeywordList', value },
      { upsert: true, new: true }
    )
  }

  await initGlobalConfig()
  return getSecuritySettings()
}

/**
 * 获取广告设置
 */
export async function getAdSettings() {
  const config = global.$globalConfig?.adSettings || {}
  return {
    googleAdEnabled:
      config.googleAdEnabled !== undefined ? config.googleAdEnabled : false,
    googleAdId: config.googleAdId || '',
    googleAdAdsTxt: config.googleAdAdsTxt || ''
  }
}

/**
 * 更新广告设置
 */
export async function updateAdSettings(data) {
  if ('googleAdEnabled' in data) {
    const value = String(data.googleAdEnabled)
    await GlobalConfig.findOneAndUpdate(
      { name: 'googleAdEnabled' },
      { name: 'googleAdEnabled', value },
      { upsert: true, new: true }
    )
  }

  if ('googleAdId' in data) {
    await GlobalConfig.findOneAndUpdate(
      { name: 'googleAdId' },
      { name: 'googleAdId', value: data.googleAdId },
      { upsert: true, new: true }
    )
  }

  if ('googleAdAdsTxt' in data) {
    await GlobalConfig.findOneAndUpdate(
      { name: 'googleAdAdsTxt' },
      { name: 'googleAdAdsTxt', value: data.googleAdAdsTxt },
      { upsert: true, new: true }
    )
  }

  await initGlobalConfig()
  return getAdSettings()
}
