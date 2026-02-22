import { Router } from 'express'
import * as gamePlayerRegisterLogController from '../../controllers/admin/gamePlayerRegisterLogController.js'

const router = Router()

router.get('/', gamePlayerRegisterLogController.list)
router.delete('/batch', gamePlayerRegisterLogController.batchDelete)
router.delete('/:id', gamePlayerRegisterLogController.deleteOne)

export default router
