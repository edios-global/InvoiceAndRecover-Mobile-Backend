import mongoose from 'mongoose';
import express from 'express'
import { addConsignmentPickupCharges, addshipmentCharges, addWeightCharges, deleteCargoPickup, deleteCargoWeight, fetchPickupCharges, fetchPickupChargesById, fetchShipmentCharges, fetchWeightCharges, fetchWeightChargesById, updatefetchPickupCharges, updatefetchWeightCharges, updateShipmentCharges } from '../controllers/shipmentController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()



router.post('/addConsignmentPickupCharges', addConsignmentPickupCharges );
router.post('/addshipmentCharges', verifyToken , addshipmentCharges );
router.post('/addWeightCharges', addWeightCharges );
router.post('/fetchShipmentCharges',verifyToken , fetchShipmentCharges );
router.post('/updateShipmentCharges', updateShipmentCharges );
router.post('/fetchWeightCharges',verifyToken, fetchWeightCharges );
router.post('/fetchPickupCharges',verifyToken, fetchPickupCharges );
router.post('/deleteCargoWeight', deleteCargoWeight );
router.post('/fetchWeightChargesById', fetchWeightChargesById );
router.post('/updatefetchWeightCharges', updatefetchWeightCharges );
router.post('/fetchPickupChargesById', fetchPickupChargesById );
router.post('/updatefetchPickupCharges', updatefetchPickupCharges );
router.post('/deleteCargoPickup', deleteCargoPickup );


export default router