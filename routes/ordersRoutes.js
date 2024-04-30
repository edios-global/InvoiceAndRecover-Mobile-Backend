import mongoose from 'mongoose';
import express from 'express'
import { addEditAddress, addOrder, addOrderItems, assignJobToDriver, createGatewayUrl, deleteAddress, deleteOrderItems, editOrderforfinalbyId, editOrderItemsforfinalbyId, fetchAddress, fetchAddressByID, fetchCreditInfo, fetchCustomerBybusinessID, fetchCustomerDetailsById, fetchDriver, fetchDropLocation, fetchOrder, fetchOrderByID, fetchOrderItemDetailsByID, fetchOrderItems, fetchOrderItemsByID, fetchOrderStatusLog, fetchPaymentIntent, fetchReacherOrderByID, fetchWarehouseByID, GenerateOrderQRCode, getOrderCharges, orderStatusUpdate, reAssignDriver, successPage, updateItemStatus, updateOrderDetails, updateOrderItems, updatePaymentStatus } from '../controllers/orderController.js';
import { webhook } from 'twilio/lib/webhooks/webhooks.js';
import { webhooks } from '../controllers/webhookController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()



router.post('/fetchOrder',verifyToken , fetchOrder);
router.post('/fetchOrderByID' , fetchOrderByID)
router.post('/fetchDriver', fetchDriver)
router.post('/fetchDropLocation' , fetchDropLocation)
router.post('/assignJobToDriver',verifyToken, assignJobToDriver)
router.post('/fetchCustomerBybusinessID',verifyToken, fetchCustomerBybusinessID)
router.post('/fetchCustomerDetailsById',verifyToken, fetchCustomerDetailsById)
router.post('/addOrder', verifyToken ,addOrder)
router.post('/fetchWarehouseByID',verifyToken, fetchWarehouseByID)
router.post('/addOrderItems',verifyToken, addOrderItems)
router.post('/fetchOrderItems',verifyToken, fetchOrderItems)
router.post('/orderStatusUpdate',verifyToken, orderStatusUpdate)
router.post('/editOrderforfinalbyId',verifyToken, editOrderforfinalbyId)
router.post('/updateOrderDetails',verifyToken, updateOrderDetails)
router.post('/fetchOrderStatusLog',verifyToken, fetchOrderStatusLog)
router.post('/reAssignDriver',verifyToken, reAssignDriver)
router.post('/editOrderItemsforfinalbyId',verifyToken, editOrderItemsforfinalbyId)
router.post('/deleteOrderItems', verifyToken ,deleteOrderItems)
router.post('/fetchOrderItemsByID',verifyToken , fetchOrderItemsByID)
router.post('/updateOrderItems',verifyToken, updateOrderItems)
router.post('/fetchCreditInfo',verifyToken , fetchCreditInfo) 
router.post('/createGatewayUrl', createGatewayUrl)  
router.post('/fetchWebhook', webhooks)  
router.get('/successPage', successPage) 
router.post('/updatePaymentStatus',verifyToken, updatePaymentStatus) 
router.post('/getOrderCharges',verifyToken, getOrderCharges)
router.post('/GenerateOrderQRCode',verifyToken, GenerateOrderQRCode)
router.post('/fetchOrderItemDetailsByID', verifyToken,fetchOrderItemDetailsByID) 
router.post('/updateItemStatus',verifyToken, updateItemStatus)  
router.post('/fetchReacherOrderByID',verifyToken, fetchReacherOrderByID)  , 
router.post('/fetchPaymentIntent',verifyToken, fetchPaymentIntent)
router.post('/addEditAddress',verifyToken, addEditAddress)
router.post('/fetchAddress',verifyToken, fetchAddress)
router.post('/deleteAddress',verifyToken, deleteAddress)
router.post('/fetchAddressByID',verifyToken, fetchAddressByID)






export default router