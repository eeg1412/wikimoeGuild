import * as categoryService from '../../services/admin/categoryService.js'
import { HTTP_CODE, BIZ_CODE } from 'shared'

export async function list(req, res, next) {
  try {
    const result = await categoryService.list(req.query)
    res.json({ code: BIZ_CODE.SUCCESS, data: result })
  } catch (error) {
    next(error)
  }
}

export async function getById(req, res, next) {
  try {
    const item = await categoryService.getById(req.params.id)
    res.json({ code: BIZ_CODE.SUCCESS, data: item })
  } catch (error) {
    next(error)
  }
}

export async function create(req, res, next) {
  try {
    const item = await categoryService.create(req.body)
    res.status(HTTP_CODE.CREATED).json({
      code: BIZ_CODE.SUCCESS,
      message: '创建成功',
      data: item,
    })
  } catch (error) {
    next(error)
  }
}

export async function update(req, res, next) {
  try {
    const item = await categoryService.update(req.params.id, req.body)
    res.json({ code: BIZ_CODE.SUCCESS, message: '更新成功', data: item })
  } catch (error) {
    next(error)
  }
}

export async function remove(req, res, next) {
  try {
    await categoryService.remove(req.params.id)
    res.json({ code: BIZ_CODE.SUCCESS, message: '删除成功' })
  } catch (error) {
    next(error)
  }
}
