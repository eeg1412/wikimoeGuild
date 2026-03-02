import * as adventurerService from '../../services/game/adventurerService.js'

/**
 * 获取我的冒险家列表
 */
export async function listMyAdventurers(req, res, next) {
  try {
    const accountId = req.player.id
    const adventurers = await adventurerService.listMyAdventurers(accountId)
    res.success(adventurers, '获取冒险家列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取冒险家详情
 */
export async function getAdventurerDetail(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await adventurerService.getAdventurerDetail(accountId, id)
    res.success(result, '获取冒险家详情成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 招募冒险家
 */
export async function recruitAdventurer(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await adventurerService.recruitAdventurer(accountId)
    res.success(result, '招募成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 自定义头像
 */
export async function customizeAvatar(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { avatar } = req.body
    if (!avatar) {
      return res.paramError('请提供头像图片')
    }
    const result = await adventurerService.customizeAvatar(
      accountId,
      id,
      avatar
    )
    res.success(result, '头像设置成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 自定义名字
 */
export async function customizeName(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { name } = req.body
    if (!name || name.length < 2 || name.length > 20) {
      return res.paramError('名字长度需要在2-20个字符之间')
    }
    const result = await adventurerService.customizeName(accountId, id, name)
    res.success(result, '名字设置成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 属性升级
 */
export async function levelUpStat(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { statType } = req.body
    if (!['attack', 'defense', 'speed', 'san'].includes(statType)) {
      return res.paramError('无效的属性类型')
    }
    const result = await adventurerService.levelUpStat(accountId, id, statType)
    res.success(result, '升级成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 装备符文石
 */
export async function equipRuneStone(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { runeStoneId } = req.body
    if (!runeStoneId) {
      return res.paramError('请选择符文石')
    }
    const result = await adventurerService.equipRuneStone(
      accountId,
      id,
      runeStoneId
    )
    res.success(result, '装备成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 卸下符文石
 */
export async function unequipRuneStone(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const result = await adventurerService.unequipRuneStone(accountId, id)
    res.success(result, '卸下成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 冒险家洗属性（元素/被动增益/攻击偏好）
 */
export async function rerollAttribute(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { rerollType } = req.body
    const result = await adventurerService.rerollAttribute(
      accountId,
      id,
      rerollType
    )
    res.success(result, '洗属性成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 设置角色标记
 */
export async function setRoleTag(req, res, next) {
  try {
    const accountId = req.player.id
    const { id } = req.params
    const { roleTag } = req.body
    const result = await adventurerService.setRoleTag(accountId, id, roleTag)
    res.success(result, '角色标记设置成功')
  } catch (error) {
    next(error)
  }
}
