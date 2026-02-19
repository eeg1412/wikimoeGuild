import Category from '../../models/Category.js'

/**
 * 分类列表（分页 + 搜索）
 */
export async function list({ page = 1, pageSize = 10, keyword = '' }) {
  const filter = {}
  if (keyword) {
    filter.title = { $regex: keyword, $options: 'i' }
  }
  const total = await Category.countDocuments(filter)
  const items = await Category.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize))
  return { list: items, total, page: Number(page), pageSize: Number(pageSize) }
}

/**
 * 分类详情
 */
export async function getById(id) {
  const item = await Category.findById(id)
  if (!item) {
    const err = new Error('分类不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}

/**
 * 创建分类
 */
export async function create(data) {
  const item = new Category(data)
  await item.save()
  return item.toJSON()
}

/**
 * 更新分类
 */
export async function update(id, data) {
  const item = await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
  if (!item) {
    const err = new Error('分类不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}

/**
 * 删除分类
 */
export async function remove(id) {
  const item = await Category.findByIdAndDelete(id)
  if (!item) {
    const err = new Error('分类不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}
