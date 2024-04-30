import mongoose from 'mongoose';
import express from 'express'
import { addDocument, addEmployee, deleteDocument, deleteEmployee,  fetchDocument, fetchDocumentById, fetchEmployee, fetchEmployeeById, fetchEmployeeName, fetchEmployeeNameList, fetchImageById, updateDocument, updateEmployee, viewFile } from '../controllers/employeeBfmController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()



router.post('/addEmployee',verifyToken , addEmployee );
router.post('/fetchEmployee', verifyToken ,fetchEmployee );
router.post('/fetchEmployeeById',verifyToken, fetchEmployeeById );
router.post('/updateEmployee',verifyToken, updateEmployee );
router.post('/deleteEmployee',verifyToken, deleteEmployee );
router.post('/addDocument',verifyToken, addDocument );
router.post('/fetchDocument', verifyToken ,fetchDocument );
router.post('/fetchDocumentById',verifyToken , fetchDocumentById );
router.post('/updateDocument',verifyToken, updateDocument );
router.post('/deleteDocument',verifyToken, deleteDocument );
router.get('/viewFile', viewFile)
router.post('/fetchEmployeeNameList',verifyToken, fetchEmployeeNameList)
router.post('/fetchImageById',verifyToken, fetchImageById)
router.post('/fetchEmployeeName',verifyToken, fetchEmployeeName)

export default router