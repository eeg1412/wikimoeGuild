import * as blogPostService from '../../services/admin/blogPostService.js'

export async function list(req, res, next) {
  try {
    const result = await blogPostService.list(req.query)
    res.success(result)
  } catch (error) {
    next(error)
  }
}

export async function getById(req, res, next) {
  try {
    const item = await blogPostService.getById(req.params.id)
    res.success(item)
  } catch (error) {
    next(error)
  }
}

export async function create(req, res, next) {
  try {
    const item = await blogPostService.create(req.body)
    res.created(item)
  } catch (error) {
    next(error)
  }
}

export async function update(req, res, next) {
  try {
    const item = await blogPostService.update(req.params.id, req.body)
    res.success(item, '更新成功')
  } catch (error) {
    next(error)
  }
}

export async function remove(req, res, next) {
  try {
    await blogPostService.remove(req.params.id)
    res.success(null, '删除成功')
  } catch (error) {
    next(error)
  }
}
