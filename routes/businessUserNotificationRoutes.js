import express from 'express'
import {
    addUserNotification, fetchNegativeEmailTemplate, fetchPositiveEmailTemplate, fetchSelectedUserbyId, fetchUsersInDropdown,
    updateNegativeEmailTemplate,
    updatePositiveEmailTemplate
} from '../controllers/businessUserNotificationController.js';
const router = express.Router()

router.post("/fetchUsersInDropdown", fetchUsersInDropdown)
router.post("/addUserNotification", addUserNotification)
router.post("/fetchSelectedUserbyId", fetchSelectedUserbyId)
router.post("/fetchPositiveEmailTemplate", fetchPositiveEmailTemplate)
router.post("/updatePositiveEmailTemplate", updatePositiveEmailTemplate)
router.post("/fetchNegativeEmailTemplate", fetchNegativeEmailTemplate)
router.post("/updateNegativeEmailTemplate", updateNegativeEmailTemplate)

export default router;