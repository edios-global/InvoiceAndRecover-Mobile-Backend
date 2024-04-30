import mongoose from 'mongoose';
import express from 'express'
import { addCustomer, checkLoginDetails, customerSignUp, deleteCustomer, fetchCustomer, fetchCustomerProfile, fetchCustomerById, fetchShippingCompany, resendOTP, updateCustomer  ,validateOTP, forgotPassword, setPassword} from '../controllers/customerBfmController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()
router.post('/addCustomer', verifyToken,addCustomer );
router.post('/fetchCustomer',verifyToken , fetchCustomer );
router.post('/fetchCustomerById',verifyToken, fetchCustomerById );
router.post('/updateCustomer', verifyToken ,updateCustomer );
router.post('/deleteCustomer',verifyToken, deleteCustomer );
router.post('/customerSignUp', customerSignUp );
router.post('/validateOTP', validateOTP );
router.post('/checkLoginDetails', checkLoginDetails );
router.get('/fetchShippingCompany', fetchShippingCompany); 
router.post('/resendOTP', resendOTP); 
router.post('/fetchCustomerProfile',verifyToken , fetchCustomerProfile); 
router.post('/forgotPassword', forgotPassword); 
router.post('/setPassword', setPassword);














export default router