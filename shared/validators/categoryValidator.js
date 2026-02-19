import Joi from 'joi'

/**
 * 创建分类校验
 */
export const createCategorySchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
})

/**
 * 更新分类校验
 */
export const updateCategorySchema = Joi.object({
  title: Joi.string().min(1).max(200),
})
