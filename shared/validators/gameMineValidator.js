import Joi from 'joi'

/**
 * 矿场挖矿
 */
export const mineDigSchema = Joi.object({
  row: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({ 'any.required': '请指定行' }),
  col: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({ 'any.required': '请指定列' }),
  formationSlot: Joi.number().integer().min(1).max(10).optional()
})
