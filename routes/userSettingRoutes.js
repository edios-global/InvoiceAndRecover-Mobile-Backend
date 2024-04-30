
import express from 'express'
import {
    addUser,
    deleteUser,
    fetchRoles,
    fetchUser,
    fetchUserById,
    updateUser,


} from '../controllers/userSettingController.js'
import { verifyToken } from '../middleware/verifyToken.js'
const router = express.Router()



router.post('/addUser',verifyToken, addUser),
    router.post('/fetchRoles',verifyToken, fetchRoles)
router.post('/fetchUser', verifyToken,fetchUser)
router.post('/fetchUserById',verifyToken, fetchUserById)
router.post('/updateUser',verifyToken, updateUser)
router.post('/deleteUser',verifyToken , deleteUser)

export default router