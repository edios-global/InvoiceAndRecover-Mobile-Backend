import express from 'express'
import { addBussinessUserCheckList, addChecklist, ChecklistUpdate, deleteChecklist, fetchBusinessUserName, fetchChecklist, fetchChecklistByID } from '../controllers/checklistController.js';

const router = express.Router()

router.post("/addChecklist", addChecklist);
router.post("/fetchChecklist", fetchChecklist);
router.post("/deleteChecklist", deleteChecklist);
router.post("/ChecklistUpdate", ChecklistUpdate);
router.post("/fetchChecklistByID", fetchChecklistByID);
router.post("/fetchBusinessUserName", fetchBusinessUserName); 
router.post("/addBussinessUserCheckList", addBussinessUserCheckList); 





export default router;