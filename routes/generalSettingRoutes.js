import express from 'express'
import { fetchGeneralSetting, updateGeneralSetting, fetchSmsTemplate, updateSmsTemplate, updateEmailTemplate, fetchEmailTemplate,
    fetchFeedbackPageData, updateFeedbackPageData, fetchFeedbackRatingData, updateReviewRequest
 } from '../controllers/generalSettingController.js';
const router = express.Router()


router.post("/fetchGeneralSetting", fetchGeneralSetting);
router.post("/updateGeneralSetting", updateGeneralSetting);
router.post("/fetchSmsTemplate", fetchSmsTemplate);
router.post("/updateSmsTemplate", updateSmsTemplate);
router.post("/updateEmailTemplate", updateEmailTemplate);
router.post("/fetchEmailTemplate", fetchEmailTemplate);
router.post("/updateFeedbackPageData", updateFeedbackPageData);
router.post("/fetchFeedbackPageData", fetchFeedbackPageData);
router.post("/fetchFeedbackRatingData", fetchFeedbackRatingData);

router.post("/updateReviewRequest",updateReviewRequest)


export default router;