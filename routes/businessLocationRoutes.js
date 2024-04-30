import express from 'express'
import { addBusinessLocation, deleteBusinessLocation, fetchBusinessLocation, fetchBusinessLocationById, fetchBusinessLocationCount, fetchComapanyName, fetchLocation, updateBusinessLocation} from '../controllers/businessLocationController.js'
const router = express.Router()


router.post("/fetchBusinessLocationCount", fetchBusinessLocationCount)
router.post("/addBusinessLocation", addBusinessLocation)
router.post("/fetchBusinessLocation", fetchBusinessLocation)
router.post("/fetchBusinessLocationById", fetchBusinessLocationById)
router.post("/updateBusinessLocation", updateBusinessLocation)
router.post("/deleteBusinessLocation", deleteBusinessLocation) 
router.post("/fetchLocation", fetchLocation)
router.post("/fetchComapanyName", fetchComapanyName) 


export default router