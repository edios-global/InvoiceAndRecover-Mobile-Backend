import mongoose from 'mongoose';
import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js';
import { addloadVehicleCategory, deleteLoadPlanVehicles, fetchLoadPlanVehicles, fetchLoadPlanVehiclesByID, fetchWarehouseByID, loadPlanVehiclesUpdate, loadVehicleCategory } from '../controllers/loadPlanVehiclesController.js';

const router = express.Router()



router.post('/loadVehicleCategory', verifyToken, loadVehicleCategory);
router.post('/addloadVehicleCategory', verifyToken, addloadVehicleCategory)
router.post('/fetchLoadPlanVehicles', verifyToken, fetchLoadPlanVehicles)
router.post('/deleteLoadPlanVehicles', verifyToken, deleteLoadPlanVehicles)
router.post('/fetchLoadPlanVehiclesByID', verifyToken, fetchLoadPlanVehiclesByID)
router.post('/loadPlanVehiclesUpdate', verifyToken, loadPlanVehiclesUpdate)
router.post('/fetchWarehouseByID', verifyToken, fetchWarehouseByID)





export default router