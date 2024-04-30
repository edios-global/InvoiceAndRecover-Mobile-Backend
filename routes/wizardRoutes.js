import express from 'express'
import {
    addBusinessIntegration, addBusinessReviewLink, addCompanyInfo, addRoleRights, authUri, checkIfSiteNameAlredyExist, checkIntegrationTypeExistOrNot, deleteBusinessIntegration,
    deleteBusinessReviewLink, fetchBusinessReviewLink, fetchIntegrationData, fetchSignUpProgressData, generateToken, getQuickBooksData, updateBusinessIntegration,
    updateWizardStatusFlag, uploadCompanyLogo,
} from '../controllers/wizardController.js'
const router = express.Router()


router.post("/addCompanyInfo", addCompanyInfo)
router.post("/fetchSignUpProgressData", fetchSignUpProgressData)
router.post("/uploadCompanyLogo", uploadCompanyLogo)
router.post("/addBusinessReviewLink", addBusinessReviewLink)
router.post("/fetchBusinessReviewLink", fetchBusinessReviewLink)
router.post("/deleteBusinessReviewLink", deleteBusinessReviewLink)
router.post("/checkIntegrationTypeExistOrNot", checkIntegrationTypeExistOrNot)
router.post("/addBusinessIntegration", addBusinessIntegration)
router.post("/updateBusinessIntegration", updateBusinessIntegration)
router.post("/fetchIntegrationData", fetchIntegrationData)
router.post("/updateWizardStatusFlag", updateWizardStatusFlag)
router.post("/deleteBusinessIntegration", deleteBusinessIntegration)
router.post("/addRoleRights", addRoleRights)
router.post("/checkIfSiteNameAlredyExist", checkIfSiteNameAlredyExist)
router.post("/authUri", authUri)
router.post("/generateToken", generateToken)
router.post("/getQuickBooksData", getQuickBooksData)


export default router