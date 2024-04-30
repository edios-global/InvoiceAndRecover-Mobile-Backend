import express from 'express'
import {apSignup,
    updateAPDetails,
    apValidateOtp,
    apResendOTP,
    authenticateAPUser,
    fetchAPUsers,
    fetchAPUserById,
    apForgotPassword,
    addAffiliateUser,
    fetchCommissionTransaction,
    updateCommission,
    apUpdateCommissionStatus,
    fetchUpdatePayment,
 
    addUpdateAPBankDetails,
    fetchAPReferedUser,
    fetchAPUserProfile,
    updateAPUserProfile,
    fetchAPBankDetails,
    resetApPassword,
    fetchAPDashboardData,
    fetchCommissionTransactionById,
    apUpdatePayment,
    apMakePayment,
    updatePaymentTransaction,
    fetchAprovePendingCommision,
    activeInactiveApUser,
    viewAPBankDetails
} from '../controllers/affilateProgramController.js'
const router = express.Router()


router.post("/apSignup", apSignup)
router.post("/updateAPDetails", updateAPDetails)
router.post("/apValidateOtp", apValidateOtp)
router.post("/apResendOTP", apResendOTP)
router.post("/authenticateAPUser", authenticateAPUser)
router.post("/fetchAPUsers", fetchAPUsers)
router.post("/fetchAPUserById", fetchAPUserById)
router.post("/apForgotPassword", apForgotPassword)
router.post("/addAffiliateUser", addAffiliateUser)
router.post("/fetchCommissionTransactionById", fetchCommissionTransactionById)
router.post("/updateCommission", updateCommission)
router.post("/apUpdatePayment", apUpdateCommissionStatus)
router.post("/fetchUpdatePayment", fetchUpdatePayment)
router.post("/addUpdateAPBankDetails", addUpdateAPBankDetails)
router.post("/fetchAPReferedUser", fetchAPReferedUser)
router.post("/fetchAPUserProfile", fetchAPUserProfile)
router.post("/updateAPUserProfile", updateAPUserProfile)
router.post("/fetchAPBankDetails", fetchAPBankDetails)
router.post("/resetApPassword", resetApPassword)
router.post("/fetchAPDashboardData", fetchAPDashboardData)
router.post("/fetchCommissionTransaction", fetchCommissionTransaction)
router.post("/apUpdatePayment", apUpdatePayment)
router.post("/updatePaymentTransaction", updatePaymentTransaction)
router.post("/fetchAprovePendingCommision", fetchAprovePendingCommision)
router.post("/apMakePayment", apMakePayment)
router.post("/activeInactiveApUser", activeInactiveApUser)
router.post("/viewAPBankDetails", viewAPBankDetails)









export default router