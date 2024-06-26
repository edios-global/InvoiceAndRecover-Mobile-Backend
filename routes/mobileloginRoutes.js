import express from 'express'
import {
    addCustomerForMobileApi, validateOTPForMobileApi, wizardSignupForMobileApi,
    ResendOTPForMobileApi, authenticateUserAndLogin, resetPasswordForMobileApi
} from '../controllers/loginController.js'

import { fetchCountryAndStates } from '../controllers/countryStateController.js'
import { addUser, deleteUser, fetchUserById, fetchUsers, updateUser } from '../controllers/userController.js';
import { fetchRoles } from '../controllers/rolesController.js';
import { addCategory, deleteCategory, fetchCategoryById, fetchCategory, updateCategory, fetchCategoryName } from '../controllers/itemCategoriesController.js';
import { addContact, deleteContact, fetchContactDetailsById, fetchContactName, fetchContacts, updateContact } from '../controllers/contactController.js';
import { addItem, deleteItem, fetchItems, updateItem } from '../controllers/itemsController.js';
import {
    addorUpdateDefaultSettings, deleteBusinessUserSignature, fetchDefaultSettingCurrency,
    fetchDefaultSettings, updateBusinessUserSignature, updateDefaultSettings, uploadBusinessUserlogo,
    uploadBusinessUserSignature, viewUploadedBusinessUserSignature
} from '../controllers/defaultsettingsController.js';
import { addExpense, deleteExpense, fetchExpenses, fetchSupplierInExpense, updateExpense } from '../controllers/expenseController.js';
import { fetchInvoiceReminderTemplates, updateInvoiceReminderTemplate } from '../controllers/templatesController.js';
import {
    addQuotation, deleteQuotationDocument, emailReminderQuotation, fetchContactsInQuotation, fetchQuotation,
    fetchQuotationDetailsByID, updateQuotation, uploadQuotationDocument,
    viewFile
} from '../controllers/quotationController.js';
import { fetchParameterListForGST } from '../controllers/parameterController.js';
import { fetchInvoiceReminderLogs } from '../controllers/invoiceReminderLogController.js';
import {
    addInvoice, addRCTI, deleteInvoiceDocument, emailReminderInvoice, fetchCustomerInInvoice,
    fetchDebts, fetchDebtsNew, fetchInvoiceDetailsByID, fetchInvoiceDetailsByIDNew, fetchInvoices, fetchItemsForInvoice,
    fetchQuotationByID, fetchQuotationInInvoice, fetchRCTI, fetchRCTIDetailsByID, fetchSupplierForRCTI,
    submitInvoicePaymentDetails, updateInvoice, updateRCTI, uploadInvoiceDocument
} from '../controllers/invoiceController.js';
import { fetchQuotationContacts, fetchQuotationReportData } from '../controllers/quotationReportController.js';
import { fetchRCTIContacts, fetchRCTIReportData } from '../controllers/rctiReportController.js';
import { fetchInvoiceContacts, fetchInvoiceReportData } from '../controllers/invoiceReportController.js';
import fetchAgedPayables from '../controllers/agedPayablesController.js';
import fetchAgedReceivables from '../controllers/agedReceivablesController.js';
import {
    addInvoiceReminder, deleteInvoiceReminderTemplate, fetchInvoiceReminderById,
    fetchInvoiceReminderTemplate, fetchLegalDocName, updateInvoiceReminder
} from '../controllers/invoiceReminderTemplateController.js';
import { addInvoicePdfFormat, deleteInvoicePdfFormat, fetchInvoicePdfFormat } from '../controllers/invoicePdfFormatController.js';
import fetchContactReportDetails from '../controllers/contactReportController.js';
import { fetchBusinessUserDashboardCardData, fetchBusinessUserDashboardCardDataTest } from '../controllers/businessUserDashboardController.js';
import { fetchExpenseReportDetails } from '../controllers/expenseReportController.js';

const router = express.Router()

router.post("/addCustomer", addCustomerForMobileApi);
router.post("/setUserPassword", validateOTPForMobileApi);
router.post("/wizardSignup", wizardSignupForMobileApi);
router.post("/fetchCountryAndStates", fetchCountryAndStates);
router.post("/resendOTP", ResendOTPForMobileApi);
router.post("/authenticateUser", authenticateUserAndLogin);
router.post("/resetPassword", resetPasswordForMobileApi);

//===> Users =========>
router.post("/fetchUsers", fetchUsers);
router.post("/addUser", addUser);
router.post("/fetchUserById", fetchUserById);
router.post("/updateUser", updateUser);
router.post("/deleteUser", deleteUser);
router.post("/fetchRoles", fetchRoles);

//===> Category =========>
router.post("/addCategory", addCategory);
router.post("/fetchCategory", fetchCategory);
router.post("/fetchCategoriesById", fetchCategoryById);
router.post("/updateCategory", updateCategory);
router.post("/deleteCategory", deleteCategory);
router.post("/fetchCategoryName", fetchCategoryName);

//===> Contact =========>
router.post("/addContact", addContact);
router.post("/fetchContacts", fetchContacts);
router.post("/fetchContactDetailsById", fetchContactDetailsById);
router.post("/updateContact", updateContact);
router.post("/deleteContact", deleteContact);

//===> Contact =========>
router.post("/addContact", addContact);
router.post("/fetchContacts", fetchContacts);
router.post("/fetchContactDetailsById", fetchContactDetailsById);
router.post("/deleteContact", deleteContact);
router.post("/fetchContactName", fetchContactName);

//===> Items =========>
router.post("/addItem", addItem);
router.post("/fetchItems", fetchItems);
router.post("/updateItem", updateItem);
router.post("/deleteItem", deleteItem);


//===> Default Settings =========>
router.post("/fetchDefaultSettings", fetchDefaultSettings);
router.post("/addorUpdateDefaultSettings", addorUpdateDefaultSettings);
router.post("/uploadBusinessUserSignature", uploadBusinessUserSignature);
router.post("/uploadBusinessUserlogo", uploadBusinessUserlogo);
router.post("/viewUploadedBusinessUserSignature", viewUploadedBusinessUserSignature);
router.post("/deleteBusinessUserSignature", deleteBusinessUserSignature);
router.post("/updateDefaultSettings", updateDefaultSettings);
router.post("/updateBusinessUserSignature", updateBusinessUserSignature);
router.post("/fetchDefaultSettingCurrency", fetchDefaultSettingCurrency);


//===> Expense =========>
router.post("/addExpense", addExpense);
router.post("/fetchExpenses", fetchExpenses);
router.post("/updateExpense", updateExpense);
router.post("/deleteExpense", deleteExpense);
router.post("/fetchSupplierInExpense", fetchSupplierInExpense);



//===> Invoice Reminder Template =========>
router.post("/addInvoiceReminderTemplate", fetchInvoiceReminderTemplates);
router.post("/updateInvoiceReminderTemplate", updateInvoiceReminderTemplate);
router.post("/fetchInvoiceReminderTemplates", fetchInvoiceReminderTemplates);

//===> Quotation =========>
router.post("/fetchContactsInQuotation", fetchContactsInQuotation);
router.post("/addQuotation", addQuotation);
router.post("/fetchQuotation", fetchQuotation);
router.post("/fetchQuotationDetailsByID", fetchQuotationDetailsByID);
router.post("/updateQuotation", updateQuotation);
router.post("/uploadQuotationDocument", uploadQuotationDocument);
router.post("/deleteQuotationDocument", deleteQuotationDocument)
router.post("/emailReminderQuotation", emailReminderQuotation)
router.get("/viewFile", viewFile)

//===> Parameter =========>
router.get("/fetchParameterListForGST", fetchParameterListForGST);

//===> InvoiceReminderLogs =========>
router.post("/fetchInvoiceReminderLogs", fetchInvoiceReminderLogs);

//===> Invoice =========>
router.post("/fetchCustomerInInvoice", fetchCustomerInInvoice);
router.post("/fetchQuotationInInvoice", fetchQuotationInInvoice);
router.post("/fetchQuotationByID", fetchQuotationByID);
router.post("/fetchInvoices", fetchInvoices);
router.post("/addInvoice", addInvoice);
router.post("/fetchItemsForInvoice", fetchItemsForInvoice);
router.post("/fetchInvoiceDetailsByID", fetchInvoiceDetailsByID);
router.post("/updateInvoice", updateInvoice);
router.post("/uploadInvoiceDocument", uploadInvoiceDocument);
router.post("/deleteInvoiceDocument", deleteInvoiceDocument);
router.post("/emailReminderInvoice", emailReminderInvoice);
router.post("/submitInvoicePaymentDetails", submitInvoicePaymentDetails);
router.post("/fetchInvoiceDetailsByIDNew", fetchInvoiceDetailsByIDNew);

//===> Debts =========>
router.post("/fetchDebts", fetchDebts);



//===> RCTI =========>
router.post("/fetchSupplierForRCTI", fetchSupplierForRCTI);
router.post("/addRCTI", addRCTI);
router.post("/fetchRCTI", fetchRCTI);
router.post("/fetchRCTIDetailsByID", fetchRCTIDetailsByID);
router.post("/updateRCTI", updateRCTI);


//===> Invoice Themes (Invoice PDF Format) =========>
router.post("/addInvoicePdfFormat", addInvoicePdfFormat);
router.post("/fetchInvoicePdfFormat", fetchInvoicePdfFormat);
router.post("/deleteInvoicePdfFormat", deleteInvoicePdfFormat);


//===> Quotation Report =========>
router.post("/fetchQuotationReportData", fetchQuotationReportData);
router.post("/fetchQuotationContacts", fetchQuotationContacts);

//===> RCTI Report =========>
router.post("/fetchRCTIReportData", fetchRCTIReportData);
router.post("/fetchRCTIContacts", fetchRCTIContacts);

//===> Invoice Report =========>
router.post("/fetchInvoiceReportData", fetchInvoiceReportData);
router.post("/fetchInvoiceContacts", fetchInvoiceContacts);

//===> Aged Payables =========>
router.post("/fetchAgedPayables", fetchAgedPayables);

//===> Aged Receivables =========>
router.post("/fetchAgedReceivables", fetchAgedReceivables);

//===> ContactReport =========>
router.post("/fetchContactReportDetails", fetchContactReportDetails);

//===> ExpenseReport =========>
router.post("/fetchExpenseReportDetails", fetchExpenseReportDetails);

//===> DashboardCardData =========>
router.post("/fetchBusinessUserDashboardCardData", fetchBusinessUserDashboardCardData);

//===> Invoice Reminder Template =========>
router.post("/addInvoiceReminder", addInvoiceReminder);
router.post("/fetchInvoiceReminderById", fetchInvoiceReminderById);
router.post("/fetchInvoiceReminderTemplate", fetchInvoiceReminderTemplate);
router.post("/updateInvoiceReminder", updateInvoiceReminder);
router.post("/deleteInvoiceReminderTemplate", deleteInvoiceReminderTemplate);
router.post("/fetchLegalDocName", fetchLegalDocName);


//===test
router.post("/fetchBusinessUserDashboardCardDataTest", fetchBusinessUserDashboardCardDataTest);
router.post("/fetchDebtsNew", fetchDebtsNew);

export default router