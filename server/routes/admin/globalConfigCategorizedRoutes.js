import express from 'express'
import * as globalConfigCategorizedController from '../../controllers/admin/globalConfigCategorizedController.js'

const router = express.Router()

router.get('/site', globalConfigCategorizedController.getSiteSettings)
router.put('/site', globalConfigCategorizedController.updateSiteSettings)

router.get('/email', globalConfigCategorizedController.getEmailSettings)
router.put('/email', globalConfigCategorizedController.updateEmailSettings)
router.post(
  '/email/test',
  globalConfigCategorizedController.testEmailConnection
)

router.get('/security', globalConfigCategorizedController.getSecuritySettings)
router.put(
  '/security',
  globalConfigCategorizedController.updateSecuritySettings
)

router.get('/ad', globalConfigCategorizedController.getAdSettings)
router.put('/ad', globalConfigCategorizedController.updateAdSettings)

export default router
