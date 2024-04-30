import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { fetchParameterSettings, fetchParameterById, updateParameterSettings, addParameterSettings, deleteParameterSettings } from '../controllers/parameterSettingController.js';
const router = express.Router()

router.post("/fetchParameterSettings", verifyToken, fetchParameterSettings);   //fetchParameterSettingId
router.post("/updateParameterSettings", verifyToken, updateParameterSettings);
router.post("/fetchParameterById", verifyToken, fetchParameterById);
router.post("/addParameterSettings", verifyToken, addParameterSettings);
router.post("/deleteParameterSettings", verifyToken, deleteParameterSettings)


export default router;