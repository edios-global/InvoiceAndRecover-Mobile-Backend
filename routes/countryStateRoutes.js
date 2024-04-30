import express from 'express'
import { fetchCountry, fetchState } from '../controllers/countryStateController.js'
const router = express.Router()


router.get("/fetchState", fetchState)
router.get("/fetchCountry", fetchCountry)

export default router