import Joi from 'joi'

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .messages({ 'string.pattern.base': 'ID 格式不正确' })

const statTypes = ['attack', 'defense', 'speed', 'san']

/**
 * 自定义冒险家头像
 */
export const adventurerCustomAvatarSchema = Joi.object({
  avatar: Joi.string().required().messages({ 'any.required': '请提供头像数据' })
})

/**
 * 自定义冒险家名字
 */
export const adventurerCustomNameSchema = Joi.object({
  name: Joi.string().min(2).max(20).required().messages({
    'string.min': '名字至少 2 个字符',
    'string.max': '名字最多 20 个字符',
    'any.required': '请输入名字'
  })
})

/**
 * 冒险家属性升级
 */
export const adventurerLevelUpSchema = Joi.object({
  statType: Joi.string()
    .valid(...statTypes)
    .required()
    .messages({
      'any.only': '无效的属性类型',
      'any.required': '请选择属性类型'
    })
})

/**
 * 冒险家装备符文石
 */
export const adventurerEquipRuneStoneSchema = Joi.object({
  runeStoneId: objectId.required().messages({ 'any.required': '请选择符文石' })
})

/**
 * 冒险家洗属性（元素/被动增益/攻击偏好）
 */
const rerollTypes = ['element', 'passiveBuff', 'attackPreference']
export const adventurerRerollSchema = Joi.object({
  rerollType: Joi.string()
    .valid(...rerollTypes)
    .required()
    .messages({
      'any.only': '无效的洗属性类型',
      'any.required': '请选择洗属性类型'
    })
})
