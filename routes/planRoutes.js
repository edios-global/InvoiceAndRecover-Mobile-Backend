import express from 'express'
import { fetchPlan } from '../controllers/planController.js'
const router = express.Router()

router.post("/fetchPlan", fetchPlan)


export default router




