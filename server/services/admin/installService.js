import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import AdminAccount from '../../models/adminAccounts.js'
import GlobalConfig from '../../models/globalConfigs.js'
import { initGlobalConfig } from '../../config/globalConfig.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCK_FILE = path.resolve(__dirname, '../../inited.lock')

/**
 * 判断是否已完成初始化
 * 1. 检查 inited.lock 文件
 * 2. 检查 adminAccounts 中是否有 role=999 的账户
 */
export async function checkInited() {
  // 1. lock 文件
  if (fs.existsSync(LOCK_FILE)) {
    return true
  }
  // 2. 超级管理员账户
  const superAdmin = await AdminAccount.findOne({ role: 999 })
  return !!superAdmin
}

/**
 * 执行站点初始化
 * @param {object} params
 * @param {string} params.username  管理员用户名
 * @param {string} params.password  管理员密码
 * @param {string} params.siteTitle
 * @param {string} params.siteSubTitle
 * @param {string} params.siteKeywords
 * @param {string} params.siteUrl
 */
export async function install({
  username,
  password,
  siteTitle,
  siteSubTitle,
  siteKeywords,
  siteUrl
}) {
  // 再次校验（防止并发）
  const already = await checkInited()
  if (already) {
    return null // 调用方处理 444
  }

  // 写入超级管理员（role=999）
  const admin = new AdminAccount({
    username,
    password,
    role: 999
  })
  await admin.save()

  // 写入全局配置
  const configItems = [
    { name: 'siteTitle', value: siteTitle || '' },
    { name: 'siteSubTitle', value: siteSubTitle || '' },
    { name: 'siteKeywords', value: siteKeywords || '' },
    { name: 'siteUrl', value: siteUrl || '' }
  ]
  for (const item of configItems) {
    await GlobalConfig.findOneAndUpdate(
      { name: item.name },
      { value: item.value },
      { upsert: true, new: true }
    )
  }

  // 刷新内存中的全局配置
  await initGlobalConfig()

  // 写入 lock 文件
  fs.writeFileSync(LOCK_FILE, new Date().toISOString(), 'utf8')

  return true
}
