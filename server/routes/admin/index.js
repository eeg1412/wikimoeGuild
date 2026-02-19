import { Router } from 'express'
import { authAdmin } from '../../middlewares/auth.js'
import authRoutes from './authRoutes.js'
import blogPostRoutes from './blogPostRoutes.js'
import categoryRoutes from './categoryRoutes.js'
// ===GENERATOR_IMPORT===

const router = Router()

router.use('/auth', authRoutes)
router.use('/blog-post', authAdmin, blogPostRoutes)
router.use('/category', authAdmin, categoryRoutes)
// ===GENERATOR_ROUTE===

export default router
