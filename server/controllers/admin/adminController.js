import * as adminService from '../../services/admin/adminService.js'

/**
 * 获取管理员列表
 */
export async function listAdmins(req, res, next) {
  try {
    const { page = 1, pageSize = 20, username } = req.query
    const result = await adminService.listAdmins({
      page: Number(page),
      pageSize: Number(pageSize),
      username
    })
    res.success(result, '获取管理员列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 创建管理员（role=990）
 */
export async function createAdmin(req, res, next) {
  try {
    const admin = await adminService.createAdmin(req.body)
    res.created(admin, '创建管理员成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 更新管理员账户
 */
export async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params
    const admin = await adminService.updateAdmin(id, req.admin.id, req.body)
    res.success(admin, '更新管理员成功')
  } catch (error) {
    next(error)
  }
}
