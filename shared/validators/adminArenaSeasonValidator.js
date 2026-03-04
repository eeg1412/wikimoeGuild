import Joi from 'joi'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export const updateAdminArenaSeasonTimeSchema = Joi.object({
  startTime: Joi.date().required().messages({
    'date.base': '开始时间格式不正确',
    'any.required': '请提供开始时间'
  }),
  endTime: Joi.date().required().messages({
    'date.base': '结束时间格式不正确',
    'any.required': '请提供结束时间'
  })
})
  .custom((value, helpers) => {
    const startTime = new Date(value.startTime)
    const endTime = new Date(value.endTime)

    if (endTime <= startTime) {
      return helpers.error('any.invalid', {
        message: '结束时间必须晚于开始时间'
      })
    }

    if (endTime.getTime() - startTime.getTime() < THREE_DAYS_MS) {
      return helpers.error('any.invalid', {
        message: '开始时间和结束时间的时间区间必须大于等于三天'
      })
    }

    return value
  })
  .messages({
    'any.invalid': '{{#message}}'
  })
