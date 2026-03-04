import Joi from 'joi'

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .messages({ 'string.pattern.base': 'ID 格式不正确' })

/**
 * 符文石合成预览
 */
export const runeStonePreviewSynthesisSchema = Joi.object({
  mainRuneStoneId: objectId
    .required()
    .messages({ 'any.required': '请选择主符文石' }),
  materialRuneStoneId: objectId
    .required()
    .messages({ 'any.required': '请选择素材符文石' })
})

/**
 * 符文石合成确认
 */
export const runeStoneConfirmSynthesisSchema = Joi.object({
  previewToken: Joi.string()
    .required()
    .messages({ 'any.required': '缺少预览令牌' }),
  accept: Joi.boolean()
    .required()
    .messages({ 'any.required': '请指定是否接受合成' })
})

/**
 * 符文石批量分解
 */
export const runeStonesBatchDecomposeSchema = Joi.object({
  runeStoneIds: Joi.array()
    .items(objectId.required())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '请至少选择一个符文石',
      'array.max': '单次最多分解50个符文石',
      'any.required': '请选择要分解的符文石'
    })
})
