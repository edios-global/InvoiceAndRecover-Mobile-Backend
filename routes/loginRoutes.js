import express from 'express'
import {
    changePass,
    checkLoginDetails, facebookSignin, fetchCredit, fetchPlans, forgotPassword, generateTokenID, googleSigin, resendOTP, resetPassword, sendOTP, signup, validateOTP, validateReferralCode, wizardSignup
} from '../controllers/loginController.js'
const router = express.Router()

router.post("/forgotPassword", forgotPassword)
router.post("/signup", signup)
router.post("/checkLoginDetails", checkLoginDetails)
router.post("/resetPassword", resetPassword)
router.post("/fetchPlans", fetchPlans)
router.post("/sendOTP", sendOTP)
router.post("/validateOTP", validateOTP)
router.post("/resendOTP", resendOTP)
router.post("/validateReferralCode", validateReferralCode) 
router.post("/fetchCredit", fetchCredit)
router.post("/generateTokenID", generateTokenID)
router.post("/googleSigin", googleSigin)
router.post("/facebookSignin", facebookSignin)
router.post("/changePass", changePass)
router.post("/wizardSignup", wizardSignup)





export default router