import AdminAccount from '../../models/adminAccounts.js'

/**
 * 获取管理员列表（分页）
 * @param {object} query
 */
export async function listAdmins({ page = 1, pageSize = 20, username } = {}) {
  const filter = {}
  if (username) {
    filter.username = { $regex: username, $options: 'i' }
  }

  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    AdminAccount.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    AdminAccount.countDocuments(filter)
  ])

  return {
    list: list.map(a => a.toJSON()),
    total,
    page,
    pageSize
  }
}

/**
 * 创建管理员账户（role 固定为 990）
 * @param {object} body
 * @param {string} body.username
 * @param {string} body.password
 */
export async function createAdmin({ username, password }) {
  // 检查用户名是否重复
  const exists = await AdminAccount.findOne({ username })
  if (exists) {
    const err = new Error('用户名已存在')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  const admin = new AdminAccount({
    username,
    password,
    role: 990
  })
  await admin.save()
  return admin.toJSON()
}

/**
 * 更新管理员账户（用户名或密码）
 * @param {string} id       - 要修改的管理员 ID
 * @param {string} operatorId - 操作者 ID（防止修改自身）
 * @param {object} body
 * @param {string} [body.username]
 * @param {string} [body.password]
 */
export async function updateAdmin(id, operatorId, { username, password }) {
  const account = await AdminAccount.findById(id)
  if (!account) {
    const err = new Error('管理员不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 不允许修改 role=999 的超级管理员账号（保护机制）
  if (account.role === 999) {
    const err = new Error('不能修改超级管理员账户')
    err.statusCode = 403
    err.expose = true
    throw err
  }

  if (username) {
    // 检查用户名是否被其他账户占用
    const conflict = await AdminAccount.findOne({
      username,
      _id: { $ne: id }
    })
    if (conflict) {
      const err = new Error('用户名已被占用')
      err.statusCode = 400
      err.expose = true
      throw err
    }
    account.username = username
  }

  if (password) {
    account.password = password
  }

  await account.save()
  return account.toJSON()
}
