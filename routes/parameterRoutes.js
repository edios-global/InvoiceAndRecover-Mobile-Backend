import mongoose from 'mongoose';
import express from 'express'
import { addParameter, addParameterList, deleteParameter, deleteParameterList, fetchParameter, fetchParameterById, fetchParameterList, fetchParameterListById, fetchParameterListName, updateParameter, updateParameterList } from '../controllers/parameterController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()



router.post('/addParameter',verifyToken, addParameter);
router.post('/fetchParameter',verifyToken, fetchParameter);
router.post('/fetchParameterById',verifyToken, fetchParameterById);
router.post('/updateParameter',verifyToken, updateParameter);
router.post('/deleteParameter',verifyToken, deleteParameter );
router.post('/addParameterList',verifyToken, addParameterList );
router.post('/fetchParameterList',verifyToken, fetchParameterList );
router.post('/fetchParameterListById',verifyToken, fetchParameterListById );
router.post('/updateParameterList', verifyToken ,updateParameterList );
router.post('/deleteParameterList',verifyToken, deleteParameterList );
router.get('/fetchParameterListName', fetchParameterListName );

export default router