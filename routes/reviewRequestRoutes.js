import express from 'express'
import {
    addBulkReviewRequest, addSendIndividualRequest, checkEmailPhone, excelUploads, fetchBuisnessLocations, fetchCommunicationType,
    fetchReviewRequestTempData, fetchReviewRequestTempDataCount, fetchViewRequests,
} from '../controllers/reviewRequestController.js';

const router = express.Router();

router.post("/addSendIndividualRequest", addSendIndividualRequest)
router.post("/fetchViewRequests", fetchViewRequests)
// router.post("/fetchViewRequestsCount", fetchViewRequestsCount)
router.post("/checkEmailPhone", checkEmailPhone)
router.post("/fetchCommunicationType", fetchCommunicationType)
router.post("/excelUploads", excelUploads)
router.post("/fetchReviewRequestTempData", fetchReviewRequestTempData)
router.post("/addBulkReviewRequest", addBulkReviewRequest)

router.post("/fetchReviewRequestTempDataCount", fetchReviewRequestTempDataCount)

router.post("/fetchBuisnessLocations", fetchBuisnessLocations)



export default router;