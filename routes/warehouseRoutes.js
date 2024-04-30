import mongoose from 'mongoose';
import express from 'express'
import { addData, addWarehouse, deleteWarehouse, fetchWarehouse, fetchWarehouseById, fetchWarehouseList, fetchtempData, updateWarehouse } from '../controllers/warehouseController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()


router.post('/addWarehouse', verifyToken, addWarehouse);
router.post('/fetchWarehouse', verifyToken, fetchWarehouse);
router.post('/fetchWarehouseById', verifyToken, fetchWarehouseById);
router.post('/updateWarehouse', verifyToken, updateWarehouse);
router.post('/deleteWarehouse', verifyToken, deleteWarehouse);
router.post('/fetchWarehouseList', verifyToken, fetchWarehouseList);
router.post('/addData', verifyToken, addData);
router.post('/fetchData', verifyToken, fetchtempData);



export default router