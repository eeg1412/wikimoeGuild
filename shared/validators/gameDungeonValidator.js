import Joi from 'joi'

/**
 * 地下迷宫军团挑战
 */
export const dungeonLegionChallengeSchema = Joi.object({
  formationSlot: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': '阵容编号必须在 1-10 之间',
    'number.max': '阵容编号必须在 1-10 之间',
    'any.required': '请选择阵容'
  })
})

/**
 * 选择迷宫等级（控制符文石产出等级）
 */
export const dungeonSelectLevelSchema = Joi.object({
  level: Joi.number().integer().min(1).max(9999).required().messages({
    'number.min': '迷宫等级至少为 1',
    'number.max': '迷宫等级最大为 9999',
    'any.required': '请选择迷宫等级'
  })
})

/**
 * 结算收取水晶
 */
export const dungeonSettleSchema = Joi.object({
  autoDecomposeNormal: Joi.boolean().optional(),
  autoDecomposeRare: Joi.boolean().optional()
})
