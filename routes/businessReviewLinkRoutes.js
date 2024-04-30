
import express from 'express'
import {
    addBusinessReviewLink,
    deleteBusinessReviewLink,
    fetchBusinessReviewLink,
    checkIfSiteNameAlredyExist,
    updateBusinessReviewLink,
    fetchCountOfOnlineReviewOfBuisnessReviewLink,
    fetchBusinessReviewLinkById, changeReviewSiteSequence
} from '../controllers/businessReviewLinkController.js';
const router = express.Router()



router.post("/fetchBusinessReviewLink", fetchBusinessReviewLink)
router.post("/fetchBusinessReviewLinkById", fetchBusinessReviewLinkById)
router.post("/addBusinessReviewLink", addBusinessReviewLink)
router.post("/fetchCountOfOnlineReviewOfBuisnessReviewLink", fetchCountOfOnlineReviewOfBuisnessReviewLink)
router.post("/deleteBusinessReviewLink", deleteBusinessReviewLink)
router.post("/updateBusinessReviewLink", updateBusinessReviewLink)
router.post("/checkIfSiteNameAlredyExist", checkIfSiteNameAlredyExist)
router.post("/changeReviewSiteSequence", changeReviewSiteSequence)


export default router;

