import { Router } from 'express'
import * as inventoryController from '../../controllers/game/inventoryController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

router.get('/my', authPlayer, inventoryController.getMyInventory)

export default router
