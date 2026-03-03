import Joi from 'joi'

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .messages({ 'string.pattern.base': 'ID 格式不正确' })

const crystalTypes = [
  'attackCrystal',
  'defenseCrystal',
  'speedCrystal',
  'sanCrystal'
]
const materialTypes = [...crystalTypes, 'runeFragment']

/**
 * 官方市场出售水晶
 */
export const officialSellCrystalSchema = Joi.object({
  crystalType: Joi.string()
    .valid(...crystalTypes)
    .required()
    .messages({
      'any.only': '无效的水晶类型',
      'any.required': '请选择水晶类型'
    }),
  quantity: Joi.number().integer().min(1).max(99999).required().messages({
    'number.min': '数量至少为 1',
    'number.max': '数量最多为 99999',
    'any.required': '请输入数量'
  })
})

/**
 * 官方市场购买水晶
 */
export const officialBuyCrystalSchema = Joi.object({
  crystalType: Joi.string()
    .valid(...crystalTypes)
    .required()
    .messages({
      'any.only': '无效的水晶类型',
      'any.required': '请选择水晶类型'
    }),
  quantity: Joi.number().integer().min(1).max(99999).required().messages({
    'number.min': '数量至少为 1',
    'number.max': '数量最多为 99999',
    'any.required': '请输入数量'
  })
})

/**
 * 官方市场出售符文石
 */
export const officialSellRuneStoneSchema = Joi.object({
  runeStoneId: objectId.required().messages({ 'any.required': '请选择符文石' })
})

/**
 * 官方市场出售符文石碎片
 */
export const officialSellRuneFragmentSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(99999).required().messages({
    'number.min': '数量至少为 1',
    'number.max': '数量最多为 99999',
    'any.required': '请输入数量'
  })
})

/**
 * 发布素材出售订单
 */
export const createMaterialSellOrderSchema = Joi.object({
  materialType: Joi.string()
    .valid(...materialTypes)
    .required()
    .messages({
      'any.only': '无效的素材类型',
      'any.required': '请选择素材类型'
    }),
  quantity: Joi.number().integer().min(1).max(99999).required().messages({
    'number.min': '数量至少为 1',
    'number.max': '数量最多为 99999',
    'any.required': '请输入数量'
  }),
  unitPrice: Joi.number().integer().min(1).max(99999999).required().messages({
    'number.min': '单价至少为 1',
    'number.max': '单价最多为 99999999',
    'any.required': '请输入单价'
  })
})

/**
 * 发布素材求购订单
 */
export const createMaterialBuyOrderSchema = Joi.object({
  materialType: Joi.string()
    .valid(...materialTypes)
    .required()
    .messages({
      'any.only': '无效的素材类型',
      'any.required': '请选择素材类型'
    }),
  quantity: Joi.number().integer().min(1).max(99999).required().messages({
    'number.min': '数量至少为 1',
    'number.max': '数量最多为 99999',
    'any.required': '请输入数量'
  }),
  unitPrice: Joi.number().integer().min(1).max(99999999).required().messages({
    'number.min': '单价至少为 1',
    'number.max': '单价最多为 99999999',
    'any.required': '请输入单价'
  })
})

/**
 * 成交素材订单
 */
export const fulfillMaterialOrderSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(99999).optional().messages({
    'number.min': '数量至少为 1',
    'number.max': '数量最多为 99999'
  })
})

/**
 * 发布符文石出售
 */
export const createRuneStoneListingSchema = Joi.object({
  runeStoneId: objectId.required().messages({ 'any.required': '请选择符文石' }),
  price: Joi.number().integer().min(1).max(99999999).required().messages({
    'number.min': '价格至少为 1',
    'number.max': '价格最多为 99999999',
    'any.required': '请输入价格'
  })
})
