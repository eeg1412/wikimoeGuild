import Joi from 'joi'

/**
 * 创建文章校验
 */
export const createBlogPostSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
})

/**
 * 更新文章校验
 */
export const updateBlogPostSchema = Joi.object({
  title: Joi.string().min(1).max(200),
})
