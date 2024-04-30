import express from 'express'
import { fetchDefaultSetting, updateDefaultSetting } from '../controllers/defaultsettingsController.js';

import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()

router.post("/fetchDefaultSetting",verifyToken, fetchDefaultSetting );
router.post("/updateDefaultSetting",verifyToken, updateDefaultSetting );

export default router;