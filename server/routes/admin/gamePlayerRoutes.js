import { Router } from 'express'
import * as gamePlayerController from '../../controllers/admin/gamePlayerController.js'

const router = Router()

router.get('/', gamePlayerController.list)

export default router
