import mongoose from 'mongoose';
import express from 'express'
import {  
    fetchFirstPartyReviews,
    fetchThirdPartyReviews,
    fetchBuisnessLocations,
    fetchBuisnessReviewLinks,
 } from '../controllers/reviewController.js';
const router = express.Router()


router.post('/fetchFirstPartyReviews', fetchFirstPartyReviews);
router.post('/fetchBuisnessLocations', fetchBuisnessLocations);
router.post('/fetchBuisnessReviewLinks', fetchBuisnessReviewLinks);
router.post('/fetchThirdPartyReviews', fetchThirdPartyReviews);



export default router