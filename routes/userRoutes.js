import express from 'express'
import {
    addNewUser,
    deleteUser,
    fetchBusinessUser,
    fetchRoles,
    fetchUserCount,
    fetchUserProfile,
    updateUserProfile,
    viewFile, downloadPDFFile, deleteQR_PDFFile

} from '../controllers/userController.js'
import { verifyToken } from '../middleware/verifyToken.js'
const router = express.Router()


router.post("/fetchUserProfile", verifyToken, fetchUserProfile)
router.post("/updateUserProfile", verifyToken, updateUserProfile)
router.get('/viewFile', viewFile)
router.post('/addNewUser', verifyToken, addNewUser),
    router.post('/fetchRoles', verifyToken, fetchRoles)
router.post('/fetchUserCount', verifyToken, fetchUserCount)

router.post('/deleteUser', verifyToken, deleteUser)
router.post('/fetchBusinessUser', verifyToken, fetchBusinessUser)
router.get('/downloadPDFFile', verifyToken, downloadPDFFile)
router.post('/deleteQR_PDFFile', verifyToken, deleteQR_PDFFile)

export default router