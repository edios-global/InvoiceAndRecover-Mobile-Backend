import mongoose from 'mongoose';
import express from 'express'
import { addDeliveryTime, deleteDeliveryTime, fetchDeliveryTime, fetchDeliveryTimeById, updateDeliveryTime } from '../controllers/deliveryTimeController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()



router.post('/addDeliveryTime',verifyToken , addDeliveryTime );
router.post('/fetchDeliveryTime',verifyToken , fetchDeliveryTime );
router.post('/fetchDeliveryTimeById',verifyToken , fetchDeliveryTimeById );
router.post('/updateDeliveryTime',verifyToken , updateDeliveryTime );
router.post('/deleteDeliveryTime',verifyToken , deleteDeliveryTime  );

export default router