import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import InvoiceReminder from '../models/invoiceReminderTemplateModel.js';
// import LegalDocumentFormat from '../models/legalDocumentFormatModel.js';
import { generateSearchParameterList, uploadImageFile } from '../routes/genericMethods.js'
import LegalDocumentFormats from '../models/legalDocumentFormatsModel.js';

const addInvoiceReminder = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("fg", post);

        const queryID = { _id: mongoose.Types.ObjectId(post._id) }

        let fetchInvoicePdfFormat = await InvoiceReminder.findOne(queryID);
        console.log("fetchInvoicePdfFormat", fetchInvoicePdfFormat);
        if (fetchInvoicePdfFormat) {
            if (req.files) {
                let returnedFileName = await uploadImageFile(req, "profileFileName");
                post.uploadLegalDocument = returnedFileName;
            }
            var query = { _id: mongoose.Types.ObjectId(post._id) }
            post.recordType = "U";
            post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            let newValues = { $set: post }
            const vv = await InvoiceReminder.updateOne(query, newValues)
            let successResponse = genericResponse(true, "invoice template reminder update successfully", []);
            res.status(200).json(successResponse);
        } else {
            var query = { reminderTemplateName: post.reminderTemplateName.trim() }

            if (post.reminderTemplateName && post.emailBody != "" && post.reminderTemplateName && post.emailBody != undefined) {
                const fetch = await InvoiceReminder.find(query)

                if (fetch != "" && fetch != undefined) {

                    let successResponse = genericResponse(false, "invoice template reminder name already exist", []);
                    res.status(200).json(successResponse)
                }
                else {
                    if (post.legalDocumentID === "None") {
                        post.legalDocumentStatus = false;
                        delete post.legalDocumentID;
                    } else {
                        post.legalDocumentStatus = true;
                    }
                    let addTemplates = new InvoiceReminder(post)
                    const templateAdded = await addTemplates.save();

                    let successResponse = genericResponse(true, "Invoice Template Reminder Added Successfully", templateAdded);
                    res.status(200).json(successResponse);

                }
            }
            else {
                let successResponse = genericResponse(false, "input field cant be blank", []);
                res.status(200).json(successResponse);

            }
        }



    } catch (error) {
        console.log("failed to add Invoice reminder ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateInvoiceReminder = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (req.files) {
            let returnedFileName = await uploadImageFile(req, "profileFileName");
            post.uploadLegalDocument = returnedFileName;
        }
        var query = { _id: mongoose.Types.ObjectId(post._id) }
        let newValues = { $set: post }
        const vv = await InvoiceReminder.updateOne(query, newValues)
        let successResponse = genericResponse(true, "invoice template reminder update successfully", []);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log("failed to Update invoice template reminder ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchInvoiceReminderById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        var query = { _id: mongoose.Types.ObjectId(post._id) }

        const templateAdded = await InvoiceReminder.find(query)
        let successResponse = genericResponse(true, "fetch template invoice reminder fetched successfully", templateAdded);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log("failed to add template ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchInvoiceReminderTemplate = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {};
        post.status = "All"
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

        const fetchQuery = [
            { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID) } },
            {
                $lookup:
                {
                    from: 'legal_document_formats',
                    localField: 'legalDocumentID',
                    foreignField: '_id',
                    as: 'legalDocument'
                }
            },
            { $unwind: { path: "$legalDocument", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    reminderTemplateName: "$reminderTemplateName",
                    status: "$Status",
                    reminderType: "$reminderType",
                    reminderDays: "$reminderDays",
                    emailSubject: "$emailSubject",
                    legalDocumentID: {
                        $cond: { if: { $eq: ['$legalDocumentStatus', true] }, then: "$legalDocument._id", else: "None" }
                    },
                    legalDocumentRemark: {
                        $cond: { if: { $eq: ['$legalDocumentStatus', true] }, then: "$legalDocument.documentRemark", else: "None" }
                    },
                    legalDocumentStatus: {
                        $cond: {
                            if: '$legalDocumentStatus',
                            then: "Yes",
                            else: "No"
                        }
                    }

                }
            },
            {
                $match: query
            },
        ];

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        if (post.status !== "All") {
            query.status = post.status;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = InvoiceReminder.aggregate()
        myAggregation._pipeline = fetchQuery
        InvoiceReminder.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch invoice reminders", []);
                    res.status(400).json(errorResponse);

                } else {
                    console.log(result);
                    const successResponse = genericResponse(true, "invoice reminder fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("Catch in fetchInvoiceReminderTemplate: ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    };

});

// const fetchInvoiceReminderTemplate = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;
//         var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

//         const fetchQuery = [
//             // { $match: {  } },
//             { $lookup: { from: 'legal_document_formats', localField: 'legalDocumentID', foreignField: '_id', as: 'legalDocument' } },
//             { $unwind: { path: "$legalDocument", preserveNullAndEmptyArrays: true } },
//             {
//                 $project: {
//                     reminderTemplateName: "$reminderTemplateName",
//                     status: "$status",
//                     reminderType: "$reminderType",
//                     reminderDays: "$reminderDays",
//                     emailSubject: "$emailSubject",
//                     businessUserID: "$businessUserID",
//                     legalDocumentRemark: {
//                         $cond: { if: { $eq: ['$legalDocumentStatus', true] }, then: "$legalDocument.documentRemark", else: "None" }
//                     },
//                     legalDocumentStatus: {
//                         $cond: {
//                             if: '$legalDocumentStatus',
//                             then: "Yes",
//                             else: "No"
//                         }
//                     }

//                 }
//             },
//             {
//                 $match: query
//             },
//         ];

//         let myAggregation = InvoiceReminder.aggregate(fetchQuery)
//         if (myAggregation) {

//             const successResponse = genericResponse(true, "invoice reminder fetched successfully", myAggregation);
//             res.status(200).json(successResponse);

//         } else {
//             const errorResponse = genericResponse(false, "Unable to fetch invoice reminders", []);
//             res.status(400).json(errorResponse);
//         }
//     } catch (error) {
//         console.log("Catch in fetchInvoiceReminderTemplate: ", error);
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(200).json(errorRespnse);
//     };

// });


const deleteInvoiceReminderTemplate = asyncHandler(async (req, res) => {
    try {
        let list = [];
        if (req.body.selectedRows) {
            list = req.body.selectedRows[0]._id;
        } else {
            list = req.body._id;
        }
        if (list.length > 0) {
            const User = await InvoiceReminder.deleteMany({ _id: { $in: list } });
            let successResponse = genericResponse(true, "Invoice Reminder deleted successfully.", []);
            res.status(200).json(successResponse);
        } else {
            let successResponse = genericResponse(false, "Please Select Atleast One Record!", []);
            res.status(200).json(successResponse);
        }

    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchLegalDocName = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        let query = {};

        const fetchContact = await LegalDocumentFormats.find(query, { documentName: 1 })
        if (fetchContact.length > 0) {
            let successResponse = genericResponse(true, "fetchInvoiceContacts fetched successfully.", fetchContact);
            res.status(200).json(successResponse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export {
    addInvoiceReminder,
    fetchInvoiceReminderTemplate,
    updateInvoiceReminder,
    fetchInvoiceReminderById,
    deleteInvoiceReminderTemplate,
    fetchLegalDocName
}