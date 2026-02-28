import { Router } from 'express'
import * as mailController from '../../controllers/game/mailController.js'
import { authPlayer } from '../../middlewares/auth.js'

const router = Router()

router.get('/list', authPlayer, mailController.listMails)
router.get('/unread-count', authPlayer, mailController.getUnreadCount)
router.get('/:id', authPlayer, mailController.getMailDetail)
router.post('/:id/claim', authPlayer, mailController.claimMailAttachment)
router.delete('/:id', authPlayer, mailController.deleteMail)

export default router
