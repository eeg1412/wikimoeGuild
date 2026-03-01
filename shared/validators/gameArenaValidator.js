import Joi from 'joi'

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .messages({ 'string.pattern.base': 'ID 格式不正确' })

/**
 * 竞技场报名
 */
export const arenaRegisterSchema = Joi.object({
  formationSlot: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': '阵容编号必须在 1-10 之间',
    'number.max': '阵容编号必须在 1-10 之间',
    'any.required': '请选择阵容'
  })
})

/**
 * 竞技场阵容更新（5x5 grid）
 */
export const arenaFormationUpdateSchema = Joi.object({
  grid: Joi.array()
    .length(5)
    .items(
      Joi.array()
        .length(5)
        .items(Joi.alternatives().try(objectId, Joi.valid(null)))
    )
    .required()
    .messages({ 'any.required': '请提供阵容数据' })
})

/**
 * 竞技场挑战
 */
export const arenaChallengeSchema = Joi.object({
  opponentId: Joi.string().required().messages({ 'any.required': '请选择对手' })
})
