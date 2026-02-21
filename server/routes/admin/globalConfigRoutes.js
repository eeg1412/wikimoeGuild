import { Router } from 'express'
import * as globalConfigController from '../../controllers/admin/globalConfigController.js'
import { validate } from '../../middlewares/validate.js'
import {
  createGlobalConfigSchema,
  updateGlobalConfigSchema,
  listGlobalConfigSchema
} from 'shared'

const router = Router()

router.get('/', validate(listGlobalConfigSchema), globalConfigController.list)
router.put(
  '/update',
  validate(updateGlobalConfigSchema),
  globalConfigController.findOneAndUpdate
)

export default router
