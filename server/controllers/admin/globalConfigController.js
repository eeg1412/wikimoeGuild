import * as globalConfigService from '../../services/admin/globalConfigService.js'

export async function list(req, res, next) {
  try {
    const result = await globalConfigService.list(req.query)
    res.success(result)
  } catch (error) {
    next(error)
  }
}
export async function findOneAndUpdate(req, res, next) {
  const items = req.body.items
  // 批量更新
  const results = {
    success: [],
    failed: []
  }
  for await (const item of items) {
    try {
      const updatedItem = await globalConfigService.findOneAndUpdate(
        { name: item.id },
        { value: item.value },
        { new: true }
      )
      results.success.push(updatedItem)
    } catch (error) {
      results.failed.push({ item, error })
    }
  }
  res.success(results, '批量更新完成')
}
