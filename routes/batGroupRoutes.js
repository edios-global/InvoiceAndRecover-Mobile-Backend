import mongoose from 'mongoose';
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { addBatGroup, addBatVehicle, deleteBatGroup, deleteBatVehicle, fetchBatGroup, fetchBatGroupById, fetchBatVehicle, fetchBatVehicleById, fetchDetailsByRegistration, fetchRegistrationNumber, updateBatGroup, updateBatVehicle } from '../controllers/batGroupController.js';
const router = express.Router()



router.post('/addBatGroup', verifyToken, addBatGroup);
router.post('/fetchBatGroup', verifyToken, fetchBatGroup);
router.post('/fetchBatGroupById', verifyToken, fetchBatGroupById);
router.post('/updateBatGroup', verifyToken, updateBatGroup);
router.post('/deleteBatGroup', verifyToken, deleteBatGroup);
router.post('/fetchRegistrationNumber', verifyToken, fetchRegistrationNumber);
router.post('/fetchDetailsByRegistration', verifyToken, fetchDetailsByRegistration);
router.post('/addBatVehicle', verifyToken, addBatVehicle);
router.post('/fetchBatVehicle', verifyToken, fetchBatVehicle);
router.post('/fetchBatVehicleById', verifyToken, fetchBatVehicleById);
router.post('/updateBatVehicle', verifyToken, updateBatVehicle);
router.post('/deleteBatVehicle', verifyToken, deleteBatVehicle);

export default router