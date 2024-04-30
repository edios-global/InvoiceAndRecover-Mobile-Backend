import mongoose from 'mongoose';
import express from 'express'
import { addVehicle, addVehicleDocument, deleteVehicle, deleteVehicleDocument, fetchVehicle, fetchVehicleById, fetchVehicleDocImageById, fetchVehicleDocument, fetchVehicleDocumentById, updateVehicle, updateVehicleDocument, viewFile } from '../controllers/vehicleController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()



router.post('/addVehicle',verifyToken, addVehicle);
router.post('/fetchVehicle', verifyToken,fetchVehicle);
router.post('/fetchVehicleById', verifyToken,fetchVehicleById);
router.post('/updateVehicle', verifyToken,updateVehicle);
router.post('/deleteVehicle',verifyToken, deleteVehicle);
router.post('/addVehicleDocument',verifyToken, addVehicleDocument);
router.get('/viewFile', viewFile);
router.post('/fetchVehicleDocument', verifyToken,fetchVehicleDocument);
router.post('/fetchVehicleDocumentById',verifyToken, fetchVehicleDocumentById);
router.post('/deleteVehicleDocument', verifyToken,deleteVehicleDocument);
router.post('/updateVehicleDocument',verifyToken, updateVehicleDocument);
router.post('/fetchVehicleDocImageById',verifyToken, fetchVehicleDocImageById);


export default router