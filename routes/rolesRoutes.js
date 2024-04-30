import mongoose from 'mongoose';
import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js';
import { addRole, deleteRole, fetchRoleById, fetchRoleRights, fetchRoles, fetchRolesCount, updateRole, updateRoleRights } from '../controllers/rolesController.js';
const router = express.Router()

router.post('/addRole', verifyToken, addRole);
router.post('/updateRole', verifyToken, updateRole);
router.post('/fetchRolesCount', verifyToken, fetchRolesCount);
router.post('/fetchRoles', verifyToken, fetchRoles);
router.post('/deleteRole', verifyToken, deleteRole);
router.post('/fetchRoleRights', verifyToken, fetchRoleRights);
router.post('/updateRoleRights', verifyToken, updateRoleRights);
router.post('/fetchRoleById', verifyToken, fetchRoleById);


export default router