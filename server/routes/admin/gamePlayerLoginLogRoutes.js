import { Router } from 'express'
import * as gamePlayerLoginLogController from '../../controllers/admin/gamePlayerLoginLogController.js'

const router = Router()

router.get('/', gamePlayerLoginLogController.list)
router.delete('/batch', gamePlayerLoginLogController.batchDelete)
router.delete('/:id', gamePlayerLoginLogController.deleteOne)

export default router
