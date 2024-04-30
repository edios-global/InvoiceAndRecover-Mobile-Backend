import express from 'express'
import {
    fetchActualNegativeFeedbackPageData,
    fetchActualPositiveFeedbackPageData,
    fetchFirstPositiveFeedbackRequestReminderData,
    fetchFirstReviewRequestReminderData,
    fetchNegativeEmailApologyTemplate, fetchPositiveFeedbackPageData, fetchRequestcampaign, fetchSecondPositiveFeedbackRequestReminderData, fetchSecondReviewRequestReminderData, saveResponseFeedback, updateFirstPositiveFeedbackRequestReminderData, updateFirstReviewRequestReminderData, updateNegativeEmailApologyTemplate,
    updatePositiveFeedbackPageData,
    updateRequestcampaign,
    updateSecondPositiveFeedbackRequestReminderData,
    updateSecondReviewRequestReminderData
} from '../controllers/requestcampaignsettingsController.js';


const router = express.Router()



router.post("/fetchRequestcampaign", fetchRequestcampaign)

router.post("/updateRequestcampaign", updateRequestcampaign)

router.post("/updatePositiveFeedbackPageData", updatePositiveFeedbackPageData)

router.post("/fetchPositiveFeedbackPageData", fetchPositiveFeedbackPageData)

router.post("/fetchNegativeEmailApologyTemplate", fetchNegativeEmailApologyTemplate)

router.post("/updateNegativeEmailApologyTemplate", updateNegativeEmailApologyTemplate)
router.post("/fetchActualPositiveFeedbackPageData", fetchActualPositiveFeedbackPageData)
router.post("/fetchActualNegativeFeedbackPageData", fetchActualNegativeFeedbackPageData)
router.post("/saveResponseFeedback", saveResponseFeedback)
router.post("/fetchFirstReviewRequestReminderData", fetchFirstReviewRequestReminderData)
router.post("/updateFirstReviewRequestReminderData", updateFirstReviewRequestReminderData)
router.post("/fetchSecondReviewRequestReminderData", fetchSecondReviewRequestReminderData)
router.post("/updateSecondReviewRequestReminderData", updateSecondReviewRequestReminderData)
router.post("/fetchFirstPositiveFeedbackRequestReminderData", fetchFirstPositiveFeedbackRequestReminderData)
router.post("/updateFirstPositiveFeedbackRequestReminderData", updateFirstPositiveFeedbackRequestReminderData)
router.post("/fetchSecondPositiveFeedbackRequestReminderData", fetchSecondPositiveFeedbackRequestReminderData)
router.post("/updateSecondPositiveFeedbackRequestReminderData", updateSecondPositiveFeedbackRequestReminderData)

export default router;