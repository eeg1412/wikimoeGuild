import * as botService from '../../services/admin/botService.js'

/**
 * 获取机器人列表
 */
export async function list(req, res, next) {
  try {
    const result = await botService.list(req.query)
    res.success(result, '获取机器人列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取机器人详情
 */
export async function getDetail(req, res, next) {
  try {
    const result = await botService.getDetail(req.params.id)
    res.success(result, '获取机器人详情成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 创建机器人
 */
export async function create(req, res, next) {
  try {
    const result = await botService.create(req.body)
    res.success(result, '创建机器人成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 更新机器人
 */
export async function update(req, res, next) {
  try {
    const result = await botService.update(req.params.id, req.body)
    res.success(result, '更新机器人成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 删除机器人
 */
export async function remove(req, res, next) {
  try {
    await botService.remove(req.params.id)
    res.success(null, '删除机器人成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改机器人公会名
 */
export async function updateGuildName(req, res, next) {
  try {
    const result = await botService.updateGuildName(
      req.params.id,
      req.body.guildName
    )
    res.success(result, '修改公会名成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改机器人公会图标
 */
export async function updateGuildIcon(req, res, next) {
  try {
    const result = await botService.updateGuildIcon(
      req.params.id,
      req.body.iconBase64
    )
    res.success(result, '修改公会图标成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改机器人冒险家名字
 */
export async function updateAdventurerName(req, res, next) {
  try {
    const result = await botService.updateAdventurerName(
      req.params.id,
      req.body.adventurerId,
      req.body.name
    )
    res.success(result, '修改冒险家名字成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 修改机器人冒险家头像
 */
export async function updateAdventurerAvatar(req, res, next) {
  try {
    const result = await botService.updateAdventurerAvatar(
      req.params.id,
      req.body.adventurerId,
      req.body.avatarBase64
    )
    res.success(result, '修改冒险家头像成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 手动触发机器人行动
 */
export async function triggerAction(req, res, next) {
  try {
    const result = await botService.triggerBotAction(req.params.id)
    res.success(result, '触发行动成功')
  } catch (error) {
    next(error)
  }
}
