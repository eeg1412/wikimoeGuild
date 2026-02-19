import { Router } from 'express'
import userRoutes from './userRoutes.js'
import adminRoutes from './admin/index.js'

const router = Router()

router.use('/users', userRoutes)
router.use('/admin', adminRoutes)

export default router
