import express from 'express'
import { 
    fetchFeedbackSetting, updateFeedbackSetting } 
from '../controllers/feedbackSettingController.js';

const router = express.Router()



router.post("/fetchFeedbackSetting", fetchFeedbackSetting)

router.post("/updateFeedbackSetting", updateFeedbackSetting)


export default router;