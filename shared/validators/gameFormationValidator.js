import Joi from 'joi'

/**
 * 保存阵容
 */
export const saveFormationSchema = Joi.object({
  slot: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': '阵容编号必须在 1-10 之间',
    'number.max': '阵容编号必须在 1-10 之间',
    'any.required': '请选择阵容编号'
  }),
  name: Joi.string()
    .max(20)
    .allow('')
    .default('')
    .messages({ 'string.max': '阵容名称最多 20 个字符' }),
  grid: Joi.array()
    .length(5)
    .items(
      Joi.array()
        .length(5)
        .items(
          Joi.alternatives().try(
            Joi.string().pattern(/^[a-f\d]{24}$/i),
            Joi.valid(null)
          )
        )
    )
    .required()
    .messages({ 'any.required': '请提供阵容数据' })
})
