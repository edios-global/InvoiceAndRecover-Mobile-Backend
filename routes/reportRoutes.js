import express from 'express'
import { fetchSubcriptionPlan , fetchReportForExport, fetchClientReport, fetchInvoicRevenueReport, fetchPaymentAndRevenueReport} from '../controllers/reportController.js'
const router = express.Router()

router.post("/fetchClientReport", fetchClientReport)
router.post("/fetchReportForExport", fetchReportForExport)
router.post("/fetchSubcriptionPlan", fetchSubcriptionPlan)
router.post("/fetchInvoicRevenueReport", fetchInvoicRevenueReport)
router.post("/fetchPaymentAndRevenueReport", fetchPaymentAndRevenueReport)






export default router


