import express from 'express'
import {
    addISN, checkIntegrationTypeExistOrNot, fetchIntegrationData, fetchBusinessIntegrationByID, updateISN,
    deleteBusinessIntegration,
    authUri,
    generateToken,
    getQuickBooksData,
    getQuickBooksDataByCroneJob,
    
} from '../controllers/businessIntegrationsController.js'
const router = express.Router()

router.post("/addISN", addISN)
router.post("/checkIntegrationTypeExistOrNot", checkIntegrationTypeExistOrNot)
router.post("/fetchIntegrationData", fetchIntegrationData)
router.post("/fetchBusinessIntegrationByID", fetchBusinessIntegrationByID)
router.post("/updateISN", updateISN)
router.post("/deleteBusinessIntegration", deleteBusinessIntegration)
router.post("/authUri", authUri)
router.post("/generateToken", generateToken)
router.post("/getQuickBooksData", getQuickBooksData)
router.get("/getQuickBooksDataByCroneJob", getQuickBooksDataByCroneJob)


export default router