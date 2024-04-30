import mongoose from 'mongoose';
import express from 'express'
import { addLoadVehicleAndSlot, allocateDriverFinalDelivery, assignDriverToPrime, fetchDriver, fetchDroplocation, fetchLoadPlanVehicle, fetchLoadedSlot, fetchMaxPalletVolume, fetchOrderItemsWarehouse, fetchPalletFromVehicle, fetchPlanVehicle, fetchPrimeMover, fetchSlotDetailsBySlotNumber, fetchSummaryByLoadType, fetchSummaryByLoadedVehicleID, fetchWarehouseOrderByStatus, fetchWarehouseOrderByStatus1, fetchWarehouseOrderForAllocate, fetchWarehouseOrderForFinalDelivery, fetchWarehouses, recieveOrder, updatPlanLoadStatus } from '../controllers/warehouseDashboardController.js';

const router = express.Router()



router.post('/fetchWarehouseOrderByStatus', fetchWarehouseOrderByStatus);
router.post('/fetchPlanVehicle', fetchPlanVehicle);
router.post('/fetchDroplocation', fetchDroplocation);
router.post('/fetchPalletFromVehicle', fetchPalletFromVehicle);
router.post('/fetchMaxPalletVolume', fetchMaxPalletVolume);
router.post('/fetchSummaryByLoadedVehicleID', fetchSummaryByLoadedVehicleID);
router.post('/fetchSlotDetailsBySlotNumber', fetchSlotDetailsBySlotNumber);
router.post('/fetchOrderItemsWarehouse', fetchOrderItemsWarehouse);
router.post('/addLoadVehicleAndSlot', addLoadVehicleAndSlot);
router.post('/fetchLoadedSlot', fetchLoadedSlot);
router.post('/fetchLoadPlanVehicle', fetchLoadPlanVehicle ) 
router.post('/updatPlanLoadStatus', updatPlanLoadStatus)
router.post('/fetchPrimeMover', fetchPrimeMover)   
router.post('/fetchDriver', fetchDriver) 
router.post('/assignDriverToPrime', assignDriverToPrime)  
router.post('/fetchWarehouses', fetchWarehouses) 
router.post('/fetchWarehouseOrderForAllocate', fetchWarehouseOrderForAllocate)  
router.post('/fetchWarehouseOrderForFinalDelivery', fetchWarehouseOrderForFinalDelivery) 
router.post('/allocateDriverFinalDelivery', allocateDriverFinalDelivery)
router.post('/fetchSummaryByLoadType', fetchSummaryByLoadType)
router.post('/recieveOrder', recieveOrder)
router.post('/fetchWarehouseOrderByStatus1', fetchWarehouseOrderByStatus1)










export default router