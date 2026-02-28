import { Router } from 'express'
import * as gameMailController from '../../controllers/admin/gameMailController.js'

const router = Router()

router.post('/send', gameMailController.sendMail)

export default router
