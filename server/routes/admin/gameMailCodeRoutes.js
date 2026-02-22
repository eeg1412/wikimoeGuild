import { Router } from 'express'
import * as gameMailCodeController from '../../controllers/admin/gameMailCodeController.js'

const router = Router()

router.get('/', gameMailCodeController.list)
router.delete('/batch', gameMailCodeController.batchDelete)
router.delete('/:id', gameMailCodeController.deleteOne)

export default router
