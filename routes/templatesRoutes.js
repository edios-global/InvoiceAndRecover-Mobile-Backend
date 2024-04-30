import express from 'express'
import { addTemplates, fetchTemplate, updateTemplate, fetchTemplateById } from '../controllers/templatesController.js'
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()


router.post("/addTemplates", verifyToken, addTemplates)
router.post("/fetchTemplate", verifyToken, fetchTemplate)
router.post("/updateTemplate", verifyToken, updateTemplate)
router.post("/fetchTemplateById", verifyToken, fetchTemplateById)

export default router