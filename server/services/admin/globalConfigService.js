import GlobalConfig from '../../models/globalConfigs.js'

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
