import express from 'express'
import { addCard, cancelSubscription, cardDelete, changeSubscriptionPlan, changeToBasic, fetchCurrentPlanDetails,
    fetchPaymentIntent,
    fetchSubscriptionPlans,
    fetchcards,
    payWithSavedCard,
    setDefaultCard} from '../controllers/billingController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router()

router.post("/fetchCurrentPlanDetails",verifyToken,  fetchCurrentPlanDetails); 
router.get("/fetchSubscriptionPlans", fetchSubscriptionPlans); 
router.post("/fetchcards",verifyToken , fetchcards); 
router.post("/fetchPaymentIntent",verifyToken , fetchPaymentIntent);  
router.post("/cardDelete",verifyToken, cardDelete); 
router.post("/setDefaultCard",verifyToken, setDefaultCard); 
router.post("/changeSubscriptionPlan",verifyToken, changeSubscriptionPlan); 
router.post("/payWithSavedCard",verifyToken, payWithSavedCard);  
router.post("/changeToBasic",verifyToken , changeToBasic); 
router.post("/cancelSubscription",verifyToken, cancelSubscription); 
router.post("/addCard",verifyToken , addCard); 



export default router;