import express from 'express'
import { fetchClientPlanFeatures, fetchClients, fetchClientUsers, fetchSelectedClients, fetchBusinessLocationInfo, getSesstionDataByUserID, fetchClientActDeactDetailsByID, deactivateClient, activateClient, fetchPlanFeatureNameById, updateUserPlanFeature, fetchFeautreCount, fetchSubsciptionTransactions, fetchSubsciptionTransactionType, fetchInvoicesAndPayments
 } from '../controllers/clientsController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()

router.post("/fetchClients",verifyToken , fetchClients);
router.post("/fetchClientPlanFeatures", verifyToken ,fetchClientPlanFeatures);
router.post("/fetchClientUsers", verifyToken ,fetchClientUsers);
router.post("/fetchSelectedClients",verifyToken , fetchSelectedClients);
router.post("/fetchBusinessLocationInfo",verifyToken , fetchBusinessLocationInfo);
router.post("/getSesstionDataByUserID" , getSesstionDataByUserID);
router.post("/fetchClientActDeactDetailsByID",verifyToken, fetchClientActDeactDetailsByID);
router.post("/deactivateClient",verifyToken, deactivateClient);
router.post("/activateClient",verifyToken , activateClient);
router.post("/fetchPlanFeatureNameById",verifyToken , fetchPlanFeatureNameById);
router.post("/updateUserPlanFeature",verifyToken, updateUserPlanFeature);
router.post("/fetchFeautreCount",verifyToken , fetchFeautreCount);
router.post("/fetchSubsciptionTransactions",verifyToken , fetchSubsciptionTransactions);
router.post("/fetchSubsciptionTransactionType",verifyToken, fetchSubsciptionTransactionType);
router.post("/fetchInvoicesAndPayments",verifyToken , fetchInvoicesAndPayments);





export default router;