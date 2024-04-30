import express from 'express'
import { fetchThemeSetting, themesSetting } from '../controllers/themeController.js'
const router = express.Router()

router.post("/themesSetting",themesSetting)
router.post("/fetchThemeSetting",fetchThemeSetting)

                                                                         
export default router;