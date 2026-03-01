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
