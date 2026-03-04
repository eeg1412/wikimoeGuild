import Joi from 'joi'
import { VALID_ROLE_TAGS } from '../constants/index.js'

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
    }),
  times: Joi.number().integer().valid(1, 5, 10).default(1).messages({
    'any.only': '升级次数只能为 1、5 或 10'
  })
})

/**
 * 冒险家属性降级
 */
export const adventurerLevelDownSchema = Joi.object({
  statType: Joi.string()
    .valid(...statTypes)
    .required()
    .messages({
      'any.only': '无效的属性类型',
      'any.required': '请选择属性类型'
    }),
  times: Joi.number().integer().valid(1, 5, 10).default(1).messages({
    'any.only': '降级次数只能为 1、5 或 10'
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

/**
 * 冒险家设置角色标记
 * 使用字符串编号存储：'1'=输出 '2'=坦克 '3'=刺客 '4'=平衡，''=清除
 */
export const adventurerSetRoleTagSchema = Joi.object({
  roleTag: Joi.string()
    .valid(...VALID_ROLE_TAGS)
    .required()
    .messages({
      'any.only': '无效的角色标记',
      'any.required': '请选择角色标记'
    })
})

/**
 * 批量装备最高级符文石
 */
export const adventurerBatchEquipBestSchema = Joi.object({
  adventurerIds: Joi.array()
    .items(objectId)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '请至少选择一个冒险家',
      'array.max': '最多选择 50 个冒险家',
      'any.required': '请选择冒险家'
    })
})

/**
 * 保存属性自动分配比例
 */
export const adventurerSaveDistributeRatioSchema = Joi.object({
  attack: Joi.number().integer().min(0).max(100).required(),
  defense: Joi.number().integer().min(0).max(100).required(),
  speed: Joi.number().integer().min(0).max(100).required(),
  san: Joi.number().integer().min(0).max(100).required()
})
  .custom((value, helpers) => {
    const total = value.attack + value.defense + value.speed + value.san
    if (total !== 100) {
      return helpers.error('any.invalid', { message: '四项比例之和必须为 100' })
    }
    return value
  })
  .messages({
    'any.invalid': '四项比例之和必须为 100'
  })

/**
 * 自动分配升级
 */
export const adventurerAutoDistributeLevelUpSchema = Joi.object({
  totalLevels: Joi.number().integer().min(1).max(100).required().messages({
    'number.min': '升级次数至少为 1',
    'number.max': '单次最多升级 100 级',
    'any.required': '请输入升级次数'
  })
})

/**
 * 批量按比例升降级
 */
export const adventurerBatchRatioDistributeSchema = Joi.object({
  /** 操作列表，每项包含冒险家ID、操作方向和级数 */
  operations: Joi.array()
    .items(
      Joi.object({
        adventurerId: objectId.required(),
        direction: Joi.string().valid('up', 'down').required().messages({
          'any.only': '方向只能为 up 或 down'
        }),
        totalLevels: Joi.number().integer().min(1).max(100).required()
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '请至少选择一个操作',
      'array.max': '最多 50 个操作',
      'any.required': '请提供操作列表'
    })
})
