import { Router } from 'express'
import * as blogPostController from '../../controllers/admin/blogPostController.js'
import { validate } from '../../middlewares/validate.js'
import { createBlogPostSchema, updateBlogPostSchema } from 'shared'

const router = Router()

router.get('/', blogPostController.list)
router.get('/:id', blogPostController.getById)
router.post('/', validate(createBlogPostSchema), blogPostController.create)
router.put('/:id', validate(updateBlogPostSchema), blogPostController.update)
router.delete('/:id', blogPostController.remove)

export default router
