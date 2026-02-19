import { Router } from 'express'
import * as categoryController from '../../controllers/admin/categoryController.js'
import { validate } from '../../middlewares/validate.js'
import { createCategorySchema, updateCategorySchema } from 'shared'

const router = Router()

router.get('/', categoryController.list)
router.get('/:id', categoryController.getById)
router.post('/', validate(createCategorySchema), categoryController.create)
router.put('/:id', validate(updateCategorySchema), categoryController.update)
router.delete('/:id', categoryController.remove)

export default router
