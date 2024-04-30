
import express from "express";
import { screenData, updateItemCategories, deleteCategories, fetchItemCategoriesById } from "../controllers/itemCategoriesController.js";
import { verifyToken } from '../middleware/verifyToken.js';


const router = express.Router()

router.post("/screenData", verifyToken, screenData);

router.post('/updateItemCategories', verifyToken, updateItemCategories);
router.post('/fetchItemCategoriesById', verifyToken, fetchItemCategoriesById);
router.post('/deleteCategories', verifyToken, deleteCategories);

export default router;
