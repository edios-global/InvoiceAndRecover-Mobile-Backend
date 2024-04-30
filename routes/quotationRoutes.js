import express from 'express'
import {
    fetchContactsForQuotation, fetchDetailsOnAddQuotationScreen
} from '../controllers/quotationController.js'
const router = express.Router()
import { verifyToken } from '../middleware/verifyToken.js';
router.post("/fetchContactsForQuotation", verifyToken, fetchContactsForQuotation)
// router.post("/getQuatationNumberFromSetting", verifyToken, getQuatationNumberFromSetting)
router.post("/fetchDetailsOnAddQuotationScreen", verifyToken, fetchDetailsOnAddQuotationScreen)






export default router