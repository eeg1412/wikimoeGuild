import Joi from 'joi'

/**
 * 创建配置校验
 */
export const createGlobalConfigSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  value: Joi.string().allow('', null).max(10000)
})

/**
 * 更新配置校验
 */
export const updateGlobalConfigSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().min(1).max(200).required(),
        value: Joi.string().allow('', null).max(10000)
      })
    )
    .required()
})

// 查询配置列表校验
export const listGlobalConfigSchema = Joi.object({
  keyword: Joi.array().items(Joi.string()).default([])
})
