import BlogPost from '../../models/BlogPost.js'

/**
 * 文章列表（分页 + 搜索）
 */
export async function list({ page = 1, pageSize = 10, keyword = '' }) {
  const filter = {}
  if (keyword) {
    filter.title = { $regex: keyword, $options: 'i' }
  }
  const total = await BlogPost.countDocuments(filter)
  const items = await BlogPost.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize))
  return { list: items, total, page: Number(page), pageSize: Number(pageSize) }
}

/**
 * 文章详情
 */
export async function getById(id) {
  const item = await BlogPost.findById(id)
  if (!item) {
    const err = new Error('文章不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}

/**
 * 创建文章
 */
export async function create(data) {
  const item = new BlogPost(data)
  await item.save()
  return item.toJSON()
}

/**
 * 更新文章
 */
export async function update(id, data) {
  const item = await BlogPost.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
  if (!item) {
    const err = new Error('文章不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}

/**
 * 删除文章
 */
export async function remove(id) {
  const item = await BlogPost.findByIdAndDelete(id)
  if (!item) {
    const err = new Error('文章不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}
