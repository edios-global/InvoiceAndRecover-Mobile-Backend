import  express from "express";
import { addItemData, fetchData, fetchCategoriesData, deleteItem, fetchItemsById, updateItems} from "../controllers/itemsController.js";

import { verifyToken } from '../middleware/verifyToken.js';


const router = express.Router()

router.post("/fetchData", fetchData);
router.post('/addItemData', addItemData);
router.get("/CategoriesData", fetchCategoriesData);
router.post('/deleteItemdata', deleteItem);
router.post('/fetchItemsById', fetchItemsById);
router.post('/updateItems', updateItems);


export default router;