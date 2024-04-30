import express from 'express'
import {
    fetchBusinessUserDasboardActivityData, fetchBusinessUserDasboardBarChartData, fetchBusinessUserDasboardLineChartData, fetchBusinessUserDasboardLineChartDataOrderRevenue, fetchBusinessUserDashboardData, fetchDasboardBusinessUserGridData, fetchDasboardSuperAdminGridData, fetchSuperAdminDasboardActivityData,
    fetchSuperAdminDasboardBarChartData, fetchSuperAdminDasboardLineChartData, fetchSuperAdminDasboardLineChartDataRevenue, fetchSuperAdminDashboardData
} from '../controllers/dashboardController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()

// Super Admin
router.get('/fetchSuperAdminDashboardData',verifyToken , fetchSuperAdminDashboardData);
router.get('/fetchSuperAdminDasboardBarChartData', verifyToken ,fetchSuperAdminDasboardBarChartData);
router.get('/fetchSuperAdminDasboardLineChartData',verifyToken , fetchSuperAdminDasboardLineChartData);
router.get('/fetchSuperAdminDasboardActivityData', verifyToken ,fetchSuperAdminDasboardActivityData);
router.post('/fetchDasboardSuperAdminGridData',verifyToken, fetchDasboardSuperAdminGridData)
router.get('/fetchSuperAdminDasboardLineChartDataRevenue',verifyToken, fetchSuperAdminDasboardLineChartDataRevenue)

// Business User
router.post('/fetchBusinessUserDashboardData',verifyToken , fetchBusinessUserDashboardData);
router.post('/fetchBusinessUserDasboardBarChartData',verifyToken , fetchBusinessUserDasboardBarChartData);
router.post('/fetchBusinessUserDasboardLineChartData',verifyToken , fetchBusinessUserDasboardLineChartData);
router.post('/fetchBusinessUserDasboardLineChartDataOrderRevenue',verifyToken , fetchBusinessUserDasboardLineChartDataOrderRevenue)
router.post('/fetchBusinessUserDasboardActivityData',verifyToken, fetchBusinessUserDasboardActivityData);
router.post('/fetchDasboardBusinessUserGridData',verifyToken , fetchDasboardBusinessUserGridData)



export default router