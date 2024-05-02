import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Contacts from '../models/contactModel.js';
import { copyFile, getNextSequenceValue, sendMailBySendGrid, uploadInvoiceFile, uploadQuotationFile, uploadRctiFile, validateEmail } from '../routes/genericMethods.js';
import DefaultSetting from '../models/defaultSettingsModel.js';
import Quotations from '../models/quotationModel.js';
import InvoiceModel from '../models/invoiceModel.js';
import InvoiceItems from '../models/invoiceItemsModel.js';
import InvoiceDocuments from '../models/invoiceDocumentsModel.js';
import items from '../models/itemsModel.js';
import Templates from '../models/templatesModel.js';
import InvoiceRetentionPaymentsModel from '../models/invoiceRetentionModel.js';
import RCTI from '../models/rctiModel.js';
import RCTI_Items from '../models/rctiItemsModel.js';
import RCTI_Documents from '../models/rctiDocumentsModel.js';


// Mobile API ------------->


// INVOICE

const fetchQuotationInInvoice = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchQuotationInInvoice post:", post);
        if (!post) {
            return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        }
        if (!post.businessUserID) {
            return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        }

        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

        const fetchQuotations = await Quotations.find(query, { _id: 1, quotationNumber: 1, });
        if (fetchQuotations.length > 0) {
            console.log("fetchQuotations ", fetchQuotations);
            let successResponse = genericResponse(true, "Quotations fetched successfully.", fetchQuotations);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Quotations : Quotations with Status is not found.", []);
            res.status(204).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchQuotationInInvoice =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchQuotationByID = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("post", post);
        if (!post.quotationID) {
            return res.status(204).json(genericResponse(false, "quotationID is missing.", []));
        }
        let fetch = await Quotations.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(post.quotationID),
                    //  quotationStatus: "Approved" 
                }
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "contactID",
                    foreignField: "_id",
                    as: "contacts",
                }
            },
            {
                $unwind: {
                    path: "$contacts",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "quotationdocuments",
                    localField: "_id",
                    foreignField: "quotationID",
                    as: "quotationDocuments",
                }
            },
            {
                $unwind: {
                    path: "$quotationDocuments",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "quotationitems",
                    localField: "_id",
                    foreignField: "quotationID",
                    as: "Qitems",
                }
            },
            {
                $unwind: {
                    path: "$Qitems",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$_id",
                    items: {
                        $push: {
                            itemName: { $arrayElemAt: ["$masterItem.itemName", 0] },
                            _id: "$Qitems._id",
                            itemID: "$Qitems.itemID",
                            discountAmount: "$Qitems.discountAmount",
                            discountValue: "$Qitems.discountValue",
                            discountType: "$Qitems.discountType",
                            priceValidityValue: "$Qitems.priceValidityValue",
                            priceValidity: "$Qitems.priceValidity",
                            gst: "$Qitems.gst",
                            itemQuantity: "$Qitems.itemQuantity",
                            itemPrice: "$Qitems.itemPrice",
                        }
                    },
                    contact: {
                        $push: {
                            _id: "$contacts._id",
                            name: "$contacts.name",
                            emailAddress: "$contacts.emailAddress",
                        }
                    },
                    quotationDocuments: { $first: "$quotationDocuments" },
                    quotationNumber: { $first: "$quotationNumber" },
                    contactID: { $first: "$contactID" },
                    purchaseOrderNumber: { $first: "$purchaseOrderNumber" },
                    gstType: { $first: "$gstType" },
                    totalAmount: { $first: "$totalAmount" },
                    totalDiscountAmount: { $first: "$totalDiscountAmount" },
                    finalAmount: { $first: "$finalAmount" },
                    paymentInstruction: { $first: "$paymentInstruction" },

                }
            },
            {
                $project: {
                    _id: 1,
                    items: 1,
                    contact: 1,
                    quotationDocuments: 1,
                    quotationNumber: 1,
                    contactID: 1,
                    purchaseOrderNumber: 1,
                    gstType: 1,
                    totalAmount: 1,
                    totalDiscountAmount: 1,
                    finalAmount: 1,
                    paymentInstruction: 1
                }
            }
        ]);
        console.log("fetch", fetch, fetch[0].items[0]);
        return res.status(200).json(genericResponse(true, "Approved Quotations Fetched Successfuly", fetch))

    } catch (error) {
        console.log("error in fetchQuotationInInvoice =", error.message);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const addInvoice = asyncHandler(async (req, res) => {

    let post = req.body;
    try {
        console.log("addinvoice post :-", post);
        console.log("retentionData post :-", typeof post.retentionData);

        let query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        const fetchInvoice = await DefaultSetting.findOne(query, { invoicePrefix: 1, invoiceStartNumber: 1, });
        if (fetchInvoice && fetchInvoice.invoicePrefix && fetchInvoice.invoiceStartNumber) {
            const InvoiceStartNumber = await getNextSequenceValue("invoiceNumber", post.businessUserID, fetchInvoice.invoiceStartNumber);
            if (!InvoiceStartNumber) {
                return res.status(200).json(genericResponse(false, "Invoice not Added. Error in generating Invoice Number.", []));
            }

            post.invoiceSequenceNumber = InvoiceStartNumber;
            post.invoiceNumber = fetchInvoice.invoicePrefix + "-" + InvoiceStartNumber;
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.invoiceDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.recordType = "I";
            post.currencyValue = fetchInvoice.currencyValue;
            post.invoiceStatus = "Unpaid";

            if (post.invoiceType = "Through Quotation") {
                post.totalAmount = parseFloat(post.totalAmount).toFixed(2);
                post.totalDiscountAmount = parseFloat(post.totalDiscountAmount).toFixed(2);
                post.finalAmount = parseFloat(post.finalAmount).toFixed(2);

            } else {
                delete post.quotationID
            }
            post.payablePendingAmount = parseFloat(post.finalAmount).toFixed(2);
            if (post.retentionData !== '[]') {
                post.scheduleRetention = true;
            } else {
                post.scheduleRetention = false;
            }
            const addedInvoice = await new InvoiceModel(post).save();

            if (addedInvoice._id) {
                console.log("addedInvoice._id :-", addedInvoice._id);

                if (post.retentionData !== 'undefined') {
                    await InvoiceRetentionPaymentsModel.deleteMany({ invoiceID: mongoose.Types.ObjectId(addedInvoice._id) });
                    let retentionfile = JSON.parse(post.retentionData);
                    console.log("retentionfile :-", retentionfile);
                    let RetentionList = [];
                    let count = 1
                    for (const retention of retentionfile) {
                        console.log("retention :-", retention);
                        retention.retentionNumber = addedInvoice.invoiceNumber + "/" + count
                        retention.invoiceID = mongoose.Types.ObjectId(addedInvoice._id);
                        retention.retentionStatus = "Unpaid";
                        retention.retentionPaymentAmount = parseFloat(retention.retentionPaymentAmount);
                        retention.retentionDueDate = retention.retentionDueDate
                        retention.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                        RetentionList.push(retention);
                        count++;
                    }
                    await InvoiceRetentionPaymentsModel.insertMany(RetentionList);
                }
                if (post.invoiceType = "Through Quotation") {

                    // Parse the JSON string into an array of objects
                    let ItemsList = JSON.parse(post.ItemsList);
                    let addedInvoiceItem = []
                    for (const element of ItemsList) {
                        console.log("addinvoice element :-", element);
                        delete element._id;
                        element.itemPrice = parseFloat(element.itemPrice).toFixed(2);
                        element.itemQuantity = parseFloat(element.itemQuantity).toFixed(2);
                        element.gst = parseFloat(element.gst).toFixed(2);
                        element.priceValidityValue = parseFloat(element.priceValidityValue).toFixed(2);
                        element.discountValue = parseFloat(element.discountValue).toFixed(2);
                        // Assuming you want to set discountAmount to 0 here since it's not provided in the input
                        element.discountAmount = 0;
                        element.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                        element.recordType = "I";
                        element.invoiceID = addedInvoice._id;
                        addedInvoiceItem = await new InvoiceItems(element).save();

                    }

                    console.log("addedInvoiceItemf :-", addedInvoiceItem);
                    console.log("req file :-", req.files);
                    // if (addedInvoiceItem) {
                    //     let DocList = [];

                    //     for (const doc of req.files.file) {

                    //         doc.recordType = "I";
                    //         doc.invoiceID = addedInvoice._id;
                    //         const returnedFileName = await uploadInvoiceFile(req, post.documentName, "invoiceDocuments");
                    //         doc.documentFileName = returnedFileName;
                    //         doc.referenceFolder = "invoiceDocuments/" + post.invoiceID.toString();
                    //         doc.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                    //         doc.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                    //         console.log("req doc :-", doc);
                    //         DocList.push(doc);

                    //     }
                    //     let InsertDocs = await InvoiceDocuments.insertMany(DocList);
                    // } else {
                    //     return res.status(200).json(genericResponse(false, "Invoice Added Successfully. Error in saving Invoice Items.", { _id: addedInvoice._id }));
                    // }
                }
                return res.status(200).json(genericResponse(true, "Invoice Added Successfully.", { _id: addedInvoice._id }));
            } else {
                return res.status(200).json(genericResponse(false, "Invoice not Added. Error in saving Invoice.", []));
            }
        }

    } catch (error) {
        console.log("error in Save Invoice =", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const updateInvoice = asyncHandler(async (req, res) => {
    try {
        let post = req.body;
        delete post._id;
        console.log("invoiceQuotation req.body: ", req.body);

        if (!post.invoiceID) {
            return res.status(204).json(genericResponse(false, "Invoice ID is missing.", []));
        }
        if (post.invoiceType === "Direct") {

            delete post.quotationID
        }

        post.totalAmount = parseFloat(post.totalAmount).toFixed(2);
        post.totalDiscountAmount = parseFloat(post.totalDiscountAmount).toFixed(2);
        post.finalAmount = parseFloat(post.finalAmount).toFixed(2);
        if (post.invoiceStatus === "Unpaid") { post.payablePendingAmount = post.finalAmount; }
        let Items = JSON.parse(post.ItemsList);
        let ItemsList = [];
        for (const element of Items) {
            delete element._id;
            element.itemPrice = parseFloat(element.itemPrice).toFixed(2);
            element.itemQuantity = parseFloat(element.itemQuantity).toFixed(2);
            let gstValue = parseFloat(element.gst).toFixed(2);
            // element.priceValidityValue = parseFloat(element.priceValidityValue).toFixed(2);
            element.discountValue = parseFloat(element.discountValue).toFixed(2);
            element.discountAmount = parseFloat(element.discountAmount).toFixed(2);

            delete element.gst;
            await items.updateOne(
                { _id: mongoose.Types.ObjectId(element.itemID) },
                { $set: element }
            );

            element.gst = gstValue;
            element.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            element.recordType = "I";
            element.invoiceID = post.invoiceID;
            ItemsList.push(element);
            console.log("ItemsList: ", ItemsList);
        }
        if (ItemsList) {
            await InvoiceItems.deleteMany({ invoiceID: mongoose.Types.ObjectId(post.invoiceID) });
            let insertItems = await InvoiceItems.insertMany(ItemsList);


            if (insertItems) {
                let updateInvoice = null;
                post.recordType = "U";
                post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                if (post.retentionData !== '[]') {
                    post.scheduleRetention = true;
                } else {
                    post.scheduleRetention = false;
                }
                updateInvoice = await InvoiceModel.updateOne(
                    { _id: mongoose.Types.ObjectId(post.invoiceID) }, { $set: post }
                )
                console.log("updateInvoice :-", updateInvoice);
                if (post.retentionData !== 'undefined') {
                    await InvoiceRetentionPaymentsModel.deleteMany({ invoiceID: mongoose.Types.ObjectId(post.invoiceID) });
                    let retentionfile = JSON.parse(post.retentionData);
                    console.log("retentionfile :-", retentionfile);
                    let RetentionList = [];
                    let count = 1
                    for (const retention of retentionfile) {
                        console.log("retention :-", retention);
                        retention.retentionNumber = updateInvoice.invoiceNumber + "/" + count
                        retention.invoiceID = mongoose.Types.ObjectId(post.invoiceID);
                        retention.retentionStatus = "Unpaid";
                        retention.retentionPaymentAmount = parseFloat(retention.retentionPaymentAmount);
                        retention.retentionDueDate = retention.retentionDueDate
                        retention.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                        RetentionList.push(retention);
                        count++;
                    }
                    await InvoiceRetentionPaymentsModel.insertMany(RetentionList);
                }


                if (updateInvoice.n === 1) {
                    //Send Email to Customer if "post.hasQuo_DocumentFile" is true and quotationStatus is Pending only.
                    // const fetchInvoice = await InvoiceModel.aggregate([
                    //     { $match: { _id: mongoose.Types.ObjectId(post.invoiceID) } },
                    //     {
                    //         $lookup: {
                    //             from: 'contacts',
                    //             localField: "contactID",
                    //             foreignField: "_id",
                    //             as: "contact"
                    //         }
                    //     },
                    //     { $unwind: '$contact' },
                    //     {
                    //         $project: {
                    //             _id: 1,
                    //             invoiceNumber: 1,
                    //             invoiceStatus: 1,
                    //             customerName: "$contact.name",
                    //             customerEmail: "$contact.emailAddress",
                    //             invoiceDate: {
                    //                 $concat: [
                    //                     {
                    //                         $let: {
                    //                             vars: {
                    //                                 monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                    //                             },
                    //                             in: {
                    //                                 $arrayElemAt: ['$$monthsInString', { $month: "$invoiceDate" }]
                    //                             }
                    //                         }
                    //                     },
                    //                     { $dateToString: { format: "%d", date: "$invoiceDate" } }, ", ",
                    //                     { $dateToString: { format: "%Y", date: "$invoiceDate" } },
                    //                 ]
                    //             },
                    //             dueDate: {
                    //                 $concat: [
                    //                     {
                    //                         $let: {
                    //                             vars: {
                    //                                 monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                    //                             },
                    //                             in: {
                    //                                 $arrayElemAt: ['$$monthsInString', { $month: "$dueDate" }]
                    //                             }
                    //                         }
                    //                     },
                    //                     { $dateToString: { format: "%d", date: "$dueDate" } }, ", ",
                    //                     { $dateToString: { format: "%Y", date: "$dueDate" } },
                    //                 ]
                    //             },
                    //         }
                    //     },

                    // ]);
                    // if (fetchInvoice.length > 0 && (fetchInvoice[0].invoiceStatus === 'Unpaid' && post.hasQuo_DocumentFile)) {

                    //     let emailSubject = '';
                    //     let emailBody = '';
                    //     const templateQuery = { templateStatus: 'Active', templateName: 'NewUnpaidInvoicesCustomerNotification' };
                    //     const fetchedTemplates = await Templates.find(templateQuery);
                    //     if (fetchedTemplates.length > 0) {
                    //         let LINK = process.env.URL + "invoice/" + fetchInvoice[0].invoiceNumber + "/" + fetchInvoice[0]._id;
                    //         let val = fetchedTemplates[0];

                    //         val.templateSubject = val.templateSubject.replaceAll('[InvoiceNumber]', fetchInvoice[0].invoiceNumber);
                    //         val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', fetchInvoice[0].customerName);
                    //         emailSubject = val.templateSubject;

                    //         val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', fetchInvoice[0].customerName);
                    //         val.templateMessage = val.templateMessage.replaceAll('[InvoiceNumber]', fetchInvoice[0].invoiceNumber);
                    //         val.templateMessage = val.templateMessage.replaceAll('[FinalAmount]', fetchInvoice[0].finalAmount);
                    //         val.templateMessage = val.templateMessage.replaceAll('[InvoiceDate]', fetchInvoice[0].invoiceDate);
                    //         val.templateMessage = val.templateMessage.replaceAll('[DueDate]', fetchInvoice[0].dueDate);
                    //         val.templateMessage = val.templateMessage.replaceAll('[URL]', LINK);
                    //         emailBody = val.templateMessage;
                    //         await sendMailBySendGrid(fetchInvoice[0].customerEmail, emailSubject, emailBody);
                    //         return res.status(200).json(genericResponse(true, "Invoice saved successfully and Email sent to the Customer's Email Address.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                    //     } else {
                    //         return res.status(200).json(genericResponse(true, "Invoice Saved successfully but Email not sent. Please configure the Email's templates.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                    //     }
                    // }
                    // else {
                    return res.status(200).json(genericResponse(true, "Invoice updated & saved successfully.", { _id: post.invoiceID }));
                    // }
                } else {
                    return res.status(200).json(genericResponse(false, "Invoice not updated.", []));
                }

            } else {
                console.error("Items not inserted or encountered an error.");
                return res.status(200).json(genericResponse(false, "Items not inserted or encountered an error.", []));

            }

        } else {
            return res.status(200).json(genericResponse(false, "Items are missing without items invoice can't be updated.", []));
        }

    } catch (error) {
        console.log("error in updateInvoice =", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const emailReminderInvoice = asyncHandler(async (req, res) => {
    try {
        let post = req.body;
        console.log("post:emailReminderInvoice ", post);

        if (!post.invoiceID) {
            return res.status(200).json(genericResponse(false, "Invoice ID is missing.", []));
        }

        if (post.invoiceID !== 'undefined') {
            const fetchInvoice = await InvoiceModel.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(post.invoiceID) } },
                {
                    $lookup: {
                        from: 'contacts',
                        localField: "contactID",
                        foreignField: "_id",
                        as: "contact"
                    }
                },
                { $unwind: '$contact' },

                {
                    $lookup: {
                        from: 'invoice_retention_payments',
                        localField: "_id",
                        foreignField: "invoiceID",
                        as: "retention"
                    }
                },

                {
                    $project: {
                        _id: 1,
                        retention: 1,
                        invoiceNumber: 1,
                        invoiceStatus: 1,
                        finalAmount: 1,
                        currencyValue: 1,
                        customerName: "$contact.name",
                        customerEmail: "$contact.emailAddress",
                        otherEmailAddress: "$contact.otherEmailAddress",

                        invoiceDate: { "$dateToString": { "format": "%b %d, %Y", "date": "$invoiceDate" } },
                        dueDate: { "$dateToString": { "format": "%b %d, %Y", "date": "$dueDate" } },
                    }
                },

            ]);
            console.log("fetchInvoice ", fetchInvoice);

            if (fetchInvoice.length > 0 && (fetchInvoice[0].invoiceStatus === 'Unpaid')) {
                let InvoiceData = fetchInvoice[0];
                let customerEmail = [];
                customerEmail.push(InvoiceData.customerEmail);
                if (InvoiceData.otherEmailAddress.length > 0) {
                    InvoiceData.otherEmailAddress.forEach(email => {
                        if (validateEmail(email)) {
                            customerEmail.push(email);
                        }
                    });
                }
                let emailSubject = '';
                let emailBody = '';
                const templateQuery = { templateStatus: 'Active', templateName: 'NewUnpaidInvoicesCustomerNotification' };
                const fetchedTemplates = await Templates.find(templateQuery);
                console.log("fetchedTemplatess", fetchedTemplates);
                if (fetchedTemplates.length > 0) {
                    let LINK = process.env.URLPROD + "/" + "invoice/" + InvoiceData.invoiceNumber + "/" + InvoiceData._id;
                    let val = fetchedTemplates[0];

                    val.templateSubject = val.templateSubject.replaceAll('[InvoiceNumber]', InvoiceData.invoiceNumber);
                    val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', InvoiceData.customerName);
                    emailSubject = val.templateSubject;

                    val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', InvoiceData.customerName);
                    val.templateMessage = val.templateMessage.replaceAll('[InvoiceNumber]', InvoiceData.invoiceNumber);
                    val.templateMessage = val.templateMessage.replaceAll('[FinalAmount]', `(${InvoiceData.currencyValue}) ${InvoiceData.finalAmount}`);
                    val.templateMessage = val.templateMessage.replaceAll('[InvoiceDate]', InvoiceData.invoiceDate);
                    val.templateMessage = val.templateMessage.replaceAll('[DueDate]', InvoiceData.dueDate);
                    val.templateMessage = val.templateMessage.replaceAll('[URL]', LINK);
                    let retentionTableHTML = '';
                    if (InvoiceData.scheduleRetention && InvoiceData.retention.length > 0n) {
                        // Construct HTML for retention invoices table
                        retentionTableHTML = '<p>You have the choice to either settle the entire invoice amount at once or opt for installment payments according to the provided schedule. It is mandatory to submit the specified amounts below before the due date mentioned.</p></br>';
                        retentionTableHTML += '<table style="border-collapse: collapse; width: 84.9169%; height: 41.1112px;" border="1">';
                        retentionTableHTML += '<tbody>';
                        retentionTableHTML += '<tr style="height: 20px;">';
                        retentionTableHTML += '<td style="width: 20%; height: 20px; text-align: center;">Retention No.</td>';
                        retentionTableHTML += '<td style="width: 20%; height: 20px; text-align: center;">Status</td>';
                        retentionTableHTML += '<td style="width: 30%; height: 20px; text-align: center;">Retention Due Date</td>';
                        retentionTableHTML += '<td style="width: 30%; height: 20px; text-align: center;">Payable Amount (' + InvoiceData.currencyValue + ')</td>';
                        retentionTableHTML += '</tr>';
                        let dateOptions = { month: "short", day: "2-digit", year: "numeric" };
                        // Iterate over each retention invoice and populate the table rows
                        for (const invoice of InvoiceData.retention) {

                            retentionTableHTML += '<tr style="height: 20px;">';
                            retentionTableHTML += `<td style="width: 20%; height: 20px; text-align: center;">${invoice['retentionNumber']}</td>`;
                            retentionTableHTML += `<td style="width: 20%; height: 20px; text-align: center;">${invoice['retentionStatus']}</td>`;
                            retentionTableHTML += `<td style="width: 30%; height: 20px; text-align: center;">
                                    ${new Date(invoice['retentionDueDate']).toLocaleDateString("en-US", dateOptions)}</td>`;
                            retentionTableHTML += `<td style="width: 30%; height: 20px; text-align: center;">${invoice['retentionPaymentAmount']}</td>`;
                            retentionTableHTML += '</tr>';
                        }

                        retentionTableHTML += '</tbody>';
                        retentionTableHTML += '</table>';
                    }

                    // Replace placeholder with retention invoices table HTML in the email body
                    val.templateMessage = val.templateMessage.replace('[RetentionTable]', retentionTableHTML);

                    emailBody = val.templateMessage;
                    await sendMailBySendGrid(customerEmail, emailSubject, emailBody);
                    return res.status(200).json(genericResponse(true, "Invoice saved successfully and Email sent to the Customer's Email Address.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                } else {
                    return res.status(200).json(genericResponse(true, "Invoice Saved successfully but Email not sent. Please configure the Email's templates.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                }
            } else {
                return res.status(200).json(genericResponse(false, "Email not sent to Customer's Email Address. Please try again!", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
            }
        } else {
            return res.status(200).json(genericResponse(false, "invoiceID are undefined", []));
        }

    } catch (error) {
        console.log("error in emailInvoice =", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const fetchInvoices = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("post", post);
    try {
        let query = {
            dueDate: { $gt: new Date() } // Only fetch documents with dueDate greater than today's date
        };
        console.log("Dzf", query);
        const fetched = await InvoiceModel.aggregate([
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                }
            },
            {
                $lookup: {
                    from: 'contacts',
                    localField: "contactID",
                    foreignField: "_id",
                    as: "contact"
                }
            },
            {
                $unwind: {
                    path: "$contact",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'quotations',
                    localField: "quotationID",
                    foreignField: "_id",
                    as: "quotation"
                }
            },
            {
                $unwind: {
                    path: "$quotation",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    invoiceNumber: 1,
                    invoiceStatus: 1,
                    customerName: "$contact.name",
                    quotationName: "$quotation.quotationNumber",
                    invoiceDate: 1,
                    invoiceDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$invoiceDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$invoiceDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$invoiceDate" } },
                        ]
                    },
                    dueDate: 1,
                    dueDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$dueDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$dueDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$dueDate" } },
                        ]
                    },
                }
            },
            { $match: query },
        ]);

        if (fetched.length > 0) {

            let successResponse = genericResponse(true, "Invoices fetched successfully.", fetched);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Invoices greater than today's date is not found.", []);
            res.status(204).json(errorRespnse);
            return;
        }

    } catch (error) {
        console.log("Error in fetchInvoices:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const fetchInvoiceDetailsByID = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchInvoiceDetailsByID post:", post);
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { _id: mongoose.Types.ObjectId(post.invoiceID) };
        let fetch = await InvoiceModel.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "invoiceitems",
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "items",

                }
            },
            { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "invoicedocuments",
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "invoiceDocuments",

                }
            },
            { $unwind: { path: "$invoiceDocuments", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "contacts",
                    localField: "contactID",
                    foreignField: "_id",
                    as: "contacts",

                }
            },
            { $unwind: { path: "$contacts", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "invoice_retention_payments",
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "invoiceRetentionPayments",

                }
            },



            {
                $project: {
                    invoiceRetentionPayments: 1,
                    invoiceRetentionPaymentsUnpaid: {
                        $filter: {
                            input: "$invoiceRetentionPayments",
                            as: "unpaid",
                            cond: { $eq: ["$$unpaid.retentionStatus", "Unpaid"] }
                        }
                    },
                    invoiceRetentionPaymentsPaid: {
                        $filter: {
                            input: "$invoiceRetentionPayments",
                            as: "paid",
                            cond: { $eq: ["$$paid.retentionStatus", "Paid"] }
                        }
                    },
                    _id: 1,
                    items: 1,
                    invoiceDocuments: 1,
                    invoicePayment: 1,
                    quotationID: 1,
                    invoiceNumber: 1,
                    contactID: 1,
                    contacts: 1,
                    validUpto: 1,
                    scheduleRetention: 1,
                    invoiceType: 1,
                    dueDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$dueDate"
                        }
                    },
                    dueUpto: 1,
                    invoiceDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$invoiceDate"
                        }
                    },
                    purchaseOrderNumber: 1,
                    invoiceStatus: 1,
                    gstType: 1,
                    totalAmount: 1,
                    totalDiscountAmount: 1,
                    finalAmount: 1,
                    payablePendingAmount: 1,
                    paymentInstruction: 1,
                    // invoiceRetentionPayments: {
                    //     $map: {
                    //         input: "$invoiceRetentionPayments",
                    //         as: "retentionPayment",
                    //         in: {
                    //             retentionDueDate: {
                    //                 $dateToString: {
                    //                     format: "%Y-%m-%d", // Specify the desired format here
                    //                     date: "$$retentionPayment.retentionDueDate"
                    //                 }
                    //             },
                    //             retentionPaymentAmount: "$$retentionPayment.retentionPaymentAmount",
                    //             retentionNumber: "$$retentionPayment.retentionNumber",
                    //             invoiceID: "$$retentionPayment.invoiceID",
                    //             _id: "$$retentionPayment._id",
                    //             retentionStatus: "$$retentionPayment.retentionStatus",
                    //             // Include other fields from invoiceRetentionPayments if needed
                    //         }
                    //     }
                    // },
                }
            }


        ])
        if (fetch.length > 0) {

            let successResponse = genericResponse(true, "Invoice details fetched successfully.", fetch);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Invoice details not found.", []);
            res.status(202).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchInvoiceDetailsByID =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const submitInvoicePaymentDetails = asyncHandler(async (req, res) => {
    const post = req.body;

    try {
        console.log("dsf", post);

        let dateOptions = { month: "short", day: "2-digit", year: "numeric" };
        let PaymentDate = new Date(post.paymentDate).toLocaleDateString("en-US", dateOptions)
        if (!post.signatureKey || (post.signatureKey !== process.env.SIGNATURE_KEY)) {
            res.status(401).json(genericResponse(false, "Unauthorized Access.", []));
        }
        if (!post.invoiceID) {
            return res.status(200).json(genericResponse(false, "Invoice ID is missing.", []));
        }
        let SendEmail = true;
        if (post.sendEmailFlag !== undefined && post.sendEmailFlag === false) {
            SendEmail = false;
        }
        console.log("post", post);
        let query = { _id: mongoose.Types.ObjectId(post.invoiceID) };
        let fetchInvoice = await InvoiceModel.findOne(query);
        console.log("fetchInvoice", fetchInvoice);

        if (fetchInvoice?.invoicePayment?.length > 0 &&
            fetchInvoice.invoicePayment.some((paid) => paid.paymentTransactionID === post.paymentTransactionID)) {
            return res.status(200).json(genericResponse(false, "The payment has already been made with this transaction ID, please enter the correct Transaction ID.", []));
        }

        let payablePendingAmount = parseFloat(fetchInvoice.payablePendingAmount).toFixed(2);
        console.log("payablePendingAmount", payablePendingAmount);
        let FinalAmount = parseFloat(fetchInvoice.finalAmount).toFixed(2);
        console.log("FinalAmount", FinalAmount);
        let paymentAmount = parseFloat(post.paymentAmount).toFixed(2);
        console.log("paymentAmount", paymentAmount);
        // console.log("fetchInvoice.scheduleRetention", fetchInvoice.scheduleRetention); return
        if (fetchInvoice.scheduleRetention === true) {
            console.log("scheduleRetention ", fetchInvoice.scheduleRetention);
            let fetchRetention = await InvoiceRetentionPaymentsModel.findOne({ invoiceID: mongoose.Types.ObjectId(post.invoiceID) });
            console.log("fetchRetention ", fetchRetention);
            if (fetchRetention.length > 0 &&
                fetchRetention.some((paid) => paid.paymentTransactionID === post.paymentTransactionID)) {
                return res.status(200).json(genericResponse(false, "The payment has already been made with this transaction ID, please enter the correct Transaction ID.", []));
            }
            console.log("post.retentionInvoiceList ", post.retentionInvoiceList);
            post.retentionInvoiceList.forEach(async (retention) => {
                await InvoiceRetentionPaymentsModel.updateOne({ _id: mongoose.Types.ObjectId(retention._id) }, {
                    $set: {
                        retentionStatus: "Paid",
                        retentionTransactionID: post.paymentTransactionID,
                        retentionPaymentDate: post.paymentDate,
                        retentionPaymentMode: post.paymentMode,
                        lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
                        recordType: "U"
                    }
                });
            })

            post.pendingAmount = parseFloat(payablePendingAmount - paymentAmount).toFixed(2);
            if (post.pendingAmount <= 0) {
                post.invoiceStatus = "Paid";
                post.pendingAmount = 0;
            } else {
                post.invoiceStatus = "Unpaid";
            }
        }
        else {
            if (payablePendingAmount === paymentAmount) {
                if (FinalAmount === paymentAmount) {
                    post.paymentType = "Full Payment"
                } else {
                    post.paymentType = "Partial Payment"
                }
                post.invoiceStatus = "Paid";
                post.pendingAmount = 0;
            } else {
                post.invoiceStatus = "Partial Paid";
                post.pendingAmount = parseFloat(payablePendingAmount - paymentAmount).toFixed(2);
            }
            console.log("paymentDet:", post);

            fetchInvoice.invoicePayment.push(post);
            const updatedInvoicePayment = await fetchInvoice.save();
            console.log('Updated invoice:', updatedInvoicePayment);
        }

        post.payablePendingAmount = post.pendingAmount;
        post.recordType = "U";
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

        let updateInvoices = await InvoiceModel.updateOne(query, { $set: post });
        if (updateInvoices.nModified === 1) {
            if (SendEmail) {
                const fetchInvoice = await InvoiceModel.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(post.invoiceID) } },
                    {
                        $lookup: {
                            from: "contacts",
                            localField: "contactID",
                            foreignField: "_id",
                            as: 'contact'
                        }
                    },
                    { $unwind: "$contact" },
                    {
                        $lookup: {
                            from: "invoice_retention_payments",
                            localField: "_id",
                            foreignField: "invoiceID",
                            as: 'retentions'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            invoiceNumber: 1,
                            scheduleRetention: 1,
                            retentions: 1,
                            customerName: "$contact.name",
                            customerEmail: "$contact.emailAddress",
                            invoiceStatus: 1,
                            dueDate: { "$dateToString": { "format": "%b %d, %Y", "date": "$dueDate" } },
                            invoiceDate: { "$dateToString": { "format": "%b %d, %Y", "date": "$invoiceDate" } },

                            finalAmount: 1,
                            currencyValue: 1,

                            pendingAmount: "$payablePendingAmount",
                            totalPaidAmount: { $toString: { $round: [{ $subtract: ["$finalAmount", "$payablePendingAmount"] }, 2] } },

                        }
                    }
                ]);

                if (fetchInvoice.length > 0) {
                    let InvoiceData = fetchInvoice[0];
                    console.log("InvoiceData", InvoiceData);
                    let customerEmail = [];
                    customerEmail.push(InvoiceData.customerEmail);
                    if (InvoiceData.otherEmailAddress?.length > 0) {
                        InvoiceData.otherEmailAddress.forEach(email => {
                            if (validateEmail(email)) {
                                customerEmail.push(email);
                            }
                        });
                    }
                    let emailSubject = '';
                    let emailBody = '';
                    const templateQuery = { templateStatus: 'Active', templateName: 'InvoicePaymentConfirmationEmailNotification' };
                    const fetchedTemplates = await Templates.find(templateQuery);
                    if (fetchedTemplates.length > 0) {
                        let LINK = process.env.URL + "invoice/" + InvoiceData.invoiceNumber + "/" + InvoiceData._id;
                        let val = fetchedTemplates[0];

                        val.templateSubject = val.templateSubject.replaceAll('[InvoiceNumber]', InvoiceData.invoiceNumber);
                        val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', InvoiceData.customerName);
                        emailSubject = val.templateSubject;

                        val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', InvoiceData.customerName);
                        val.templateMessage = val.templateMessage.replaceAll('[InvoiceNumber]', InvoiceData.invoiceNumber);
                        val.templateMessage = val.templateMessage.replaceAll('[FinalAmount]', `(${InvoiceData.currencyValue}) ${InvoiceData.finalAmount}`);
                        val.templateMessage = val.templateMessage.replaceAll('[PendingAmount]', `(${InvoiceData.currencyValue}) ${InvoiceData.pendingAmount}`);
                        val.templateMessage = val.templateMessage.replaceAll('[InvoiceDate]', InvoiceData.invoiceDate);
                        val.templateMessage = val.templateMessage.replaceAll('[DueDate]', InvoiceData.dueDate);

                        val.templateMessage = val.templateMessage.replaceAll('[PaymentMethod]', post.paymentMode);
                        val.templateMessage = val.templateMessage.replaceAll('[TransactionID]', post.paymentTransactionID);
                        val.templateMessage = val.templateMessage.replaceAll('[PaymentDate]', PaymentDate);
                        val.templateMessage = val.templateMessage.replaceAll('[AmountPaid]', post.paymentAmount);
                        let retentionTableHTML = '';
                        if (InvoiceData.scheduleRetention && InvoiceData.retentions.length > 0) {
                            // Construct HTML for retention invoices table
                            retentionTableHTML = '<p>Below are the Invoice (Retention) Details:</p></br>';
                            retentionTableHTML += '<table style="border-collapse: collapse; width: 84.9169%; height: 41.1112px;" border="1">';
                            retentionTableHTML += '<tbody>';
                            retentionTableHTML += '<tr style="height: 20px;">';
                            retentionTableHTML += '<td style="width: 20%; height: 20px; text-align: center;">Retention No.</td>';
                            retentionTableHTML += '<td style="width: 20%; height: 20px; text-align: center;">Status</td>';
                            retentionTableHTML += '<td style="width: 30%; height: 20px; text-align: center;">Retention Due Date</td>';
                            retentionTableHTML += '<td style="width: 30%; height: 20px; text-align: center;">Payable Amount (' + InvoiceData.currencyValue + ')</td>';
                            retentionTableHTML += '</tr>';
                            let dateOptions = { month: "short", day: "2-digit", year: "numeric" };
                            // Iterate over each retention invoice and populate the table rows
                            for (const invoice of InvoiceData.retentions) {

                                retentionTableHTML += '<tr style="height: 20px;">';
                                retentionTableHTML += `<td style="width: 20%; height: 20px; text-align: center;">${invoice['retentionNumber']}</td>`;
                                retentionTableHTML += `<td style="width: 20%; height: 20px; text-align: center;">${invoice['retentionStatus']}</td>`;
                                retentionTableHTML += `<td style="width: 30%; height: 20px; text-align: center;">
                                    ${new Date(invoice['retentionDueDate']).toLocaleDateString("en-US", dateOptions)}</td>`;
                                retentionTableHTML += `<td style="width: 30%; height: 20px; text-align: center;">${invoice['retentionPaymentAmount']}</td>`;
                                retentionTableHTML += '</tr>';
                            }

                            retentionTableHTML += '</tbody>';
                            retentionTableHTML += '</table>';
                        }
                        // Replace placeholder with retention invoices table HTML in the email body
                        val.templateMessage = val.templateMessage.replace('[PaymentTableDetails]', retentionTableHTML);

                        emailBody = val.templateMessage;
                        await sendMailBySendGrid(customerEmail, emailSubject, emailBody);
                        return res.status(200).json(genericResponse(true, "Invoice saved successfully and Email sent to the Customer's Email Address.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                    }
                    else {
                        return res.status(200).json(genericResponse(true, "Invoice Saved successfully but Email not sent. Contact to Super Admin ", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                    }

                } else {
                    return res.status(200).json(genericResponse(true, `Payment Submitted Successfully. Email not sent.`, { invoiceStatus: post.invoiceStatus }));
                }

            } else {
                return res.status(200).json(genericResponse(true, `Payment Submitted Successfully.`, { invoiceStatus: post.invoiceStatus }));
            }
        }
        else {
            return res.status(200).json(genericResponse(false, "Something Error while processng the payment.", []));
        }

    } catch (error) {
        console.log("Error in Update Payment Details:", error);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

// DEBTS

const fetchDebts = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("sf", post);
    try {
        let query = {
            dueDate: { $lt: new Date() } // Only fetch documents with invoiceDate less than today's date
        };
        const fetched = await InvoiceModel.aggregate([
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                }
            },
            {
                $lookup: {
                    from: 'contacts',
                    localField: "contactID",
                    foreignField: "_id",
                    as: "contact"
                }
            },
            {
                $unwind: {
                    path: "$contact",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'quotations',
                    localField: "quotationID",
                    foreignField: "_id",
                    as: "quotation"
                }
            },
            {
                $unwind: {
                    path: "$quotation",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    invoiceNumber: 1,
                    invoiceStatus: 1,
                    customerName: "$contact.name",
                    quotationName: "$quotation.quotationNumber",
                    invoiceDate: 1,
                    invoiceDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$invoiceDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$invoiceDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$invoiceDate" } },
                        ]
                    },
                    dueDate: 1,
                    dueDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$dueDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$dueDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$dueDate" } },
                        ]
                    },
                }
            },
            { $match: query },
        ]);

        if (fetched.length > 0) {
            // console.log("fetched", fetched);
            let successResponse = genericResponse(true, "Invoices fetched successfully.", fetched);
            res.status(200).json(successResponse);

        } else {
            let errorRespnse = genericResponse(false, "Invoices less than today's date is not found.", []);
            res.status(204).json(errorRespnse);

        }
    } catch (error) {
        console.log("Error in fetchInvoices:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

// RCTI

const fetchSupplierForRCTI = asyncHandler(async (req, res) => {
    const post = req.body;
    try {

        if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Supplier", contactStatus: "Active" };

        const fetchContacts = await Contacts.find(query, { _id: 1, name: 1, });

        if (fetchContacts.length > 0) {
            let successResponse = genericResponse(true, "Supplier Name fetched successfully.", fetchContacts);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Supplier Contact : Supplier Name with Active Status is not found.", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchSupplierForRCTI =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const addRCTI = asyncHandler(async (req, res) => {
    let post = req.body;
    try {
        console.log("post(addRCTI)", post);
        console.log("post(files)", req.files);

        let query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        const fetchDefaultSetting = await DefaultSetting.findOne(query, { rctiPrefix: 1, rctiStartNumber: 1, currencyValue: 1 });
        if (fetchDefaultSetting && fetchDefaultSetting.rctiPrefix && fetchDefaultSetting.rctiStartNumber) {

            const RCTIStartNumber = await getNextSequenceValue("rctiNumber", post.businessUserID, fetchDefaultSetting.rctiStartNumber);
            if (!RCTIStartNumber) {
                return res.status(200).json(genericResponse(false, "RCTI not Added. Error in generating RCTI Number.", []));
            }
            if (post.DiscountType == 'undefined') {
                post.DiscountType = ''
            }
            if (post.totalDiscountAmount == 'undefined') {
                post.totalDiscountAmount = ''
            }

            post.rctiSequenceNumber = RCTIStartNumber;
            post.rctiNumber = fetchDefaultSetting.rctiPrefix + "-" + RCTIStartNumber;
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.rctiDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.recordType = "I";
            console.log("post(01)", post);
            post.currencyValue = fetchDefaultSetting.currencyValue;

            post.rctiStatus = "Unpaid";

            const addedRCTI = await new RCTI(post).save();
            if (addedRCTI._id) {

                // Parse the JSON string into an array of objects
                let ItemsList = JSON.parse(post.ItemsList);
                let addedInvoiceItem = []
                for (const element of ItemsList) {
                    console.log("addinvoice element :-", element);
                    delete element.createdDate;
                    delete element.recordType;
                    delete element.lastModifiedDate;
                    element.itemPrice = parseFloat(element.itemPrice).toFixed(2);
                    element.itemQuantity = parseFloat(element.itemQuantity).toFixed(2);
                    element.gst = parseFloat(element.gst).toFixed(2);
                    element.priceValidityValue = parseFloat(element.priceValidityValue).toFixed(2);
                    element.discountValue = parseFloat(element.discountValue).toFixed(2);
                    // Assuming you want to set discountAmount to 0 here since it's not provided in the input
                    element.discountAmount = 0;
                    element.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                    element.recordType = "I";
                    element.itemID = element._id;
                    element.rctiID = addedRCTI._id;
                    addedInvoiceItem = await new RCTI_Items(element).save();
                }


                // if (addedInvoiceItem) {
                //     let DocList = [];

                //     for (const doc of req.files.file) {

                //         doc.recordType = "I";
                //         doc.rctiID = addedRCTI._id;
                //         const returnedFileName = await uploadInvoiceFile(req, post.documentName, "invoiceDocuments");
                //         doc.documentFileName = returnedFileName;
                //         doc.referenceFolder = "rctiDocuments/" + post.rctiID.toString();
                //         doc.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                //         doc.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                //         console.log("req doc :-", doc);
                //         DocList.push(doc);

                //     }
                //     let InsertDocs = await RCTI_Documents.insertMany(DocList);
                // } else {
                //     return res.status(200).json(genericResponse(false, "rcti Added Successfully. Error in saving rcti Items.", { _id: addedRCTI._id }));
                // }
                return res.status(200).json(genericResponse(true, "RCTI Added Successfully.", { _id: addedRCTI._id }));
            } else {
                return res.status(200).json(genericResponse(false, "RCTI not Added.", []));
            }
        } else {
            return res.status(200).json(genericResponse(false, "RCTI not Added. Error in fetching Default Setting for RCTI.", []));
        }

    } catch (error) {
        console.log("error in addRCTI =", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const fetchRCTI = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("post", post);
    try {
        let query = {
            businessUserID: mongoose.Types.ObjectId(post.businessUserID)
        };
        console.log("Dzf", query);
        const fetched = await RCTI.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: 'contacts',
                    localField: "supplierID",
                    foreignField: "_id",
                    as: "contact"
                }
            },
            {
                $unwind: {
                    path: "$contact",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {

                    _id: 1,
                    rctiNumber: 1,
                    rctiStatus: 1,
                    supplierID: 1,
                    businessUserID: 1,
                    supplierName: "$contact.name",
                    quotationName: "$quotation.quotationNumber",
                    rctiDate1: 1,
                    rctiDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$rctiDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$rctiDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$rctiDate" } },
                        ]
                    },
                    dueDate1: 1,
                    dueDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$dueDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$dueDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$dueDate" } },
                        ]
                    },
                }
            },

        ]);

        if (fetched.length > 0) {

            let successResponse = genericResponse(true, "RCTI fetched successfully.", fetched);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "RCTI is not found.", []);
            res.status(204).json(errorRespnse);
            return;
        }

    } catch (error) {
        console.log("Error in fetchInvoices:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const fetchRCTIDetailsByID = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchRCTIDetailsByID post:", post);
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { _id: mongoose.Types.ObjectId(post.rctiID) };
        let fetch = await RCTI.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "rcti_items",
                    localField: "_id",
                    foreignField: "rctiID",
                    as: "rctiItems",

                }
            },
            { $unwind: { path: "$rctiItems", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "rcti_documents",
                    localField: "_id",
                    foreignField: "rctiID",
                    as: "rctiDocuments",

                }
            },
            { $unwind: { path: "$rctiDocuments", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "contacts",
                    localField: "supplierID",
                    foreignField: "_id",
                    as: "contacts",

                }
            },
            { $unwind: { path: "$contacts", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    _id: 1,
                    rctiItems: 1,
                    rctiDocuments: 1,
                    rctiNumber: 1,
                    supplierID: 1,
                    contacts: 1,

                    dueDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$dueDate"
                        }
                    },
                    dueUpto: 1,
                    rctiDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$rctiDate"
                        }
                    },
                    purchaseOrderNumber: 1,
                    rctiStatus: 1,
                    gstType: 1,
                    totalAmount: 1,
                    totalDiscountAmount: 1,
                    finalAmount: 1,

                    paymentInstruction: 1,
                }
            }


        ])
        if (fetch.length > 0) {

            let successResponse = genericResponse(true, "Rcti details fetched successfully.", fetch);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Rcti details not found.", []);
            res.status(202).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchRCTIDetailsByID =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateRCTI = asyncHandler(async (req, res) => {
    try {
        let post = req.body;
        delete post._id;
        console.log("updateRCTI req.body: ", post);
        return
        if (!post.rctiID) {
            return res.status(204).json(genericResponse(false, "rcti ID is missing.", []));
        }
        post.totalAmount = parseFloat(post.totalAmount).toFixed(2);
        post.totalDiscountAmount = parseFloat(post.totalDiscountAmount).toFixed(2);
        post.finalAmount = parseFloat(post.finalAmount).toFixed(2);
        // if (post.invoiceStatus === "Unpaid") { post.payablePendingAmount = post.finalAmount; }
        let Items = JSON.parse(post.ItemsList);
        let ItemsList = [];
        for (const element of Items) {
            delete element._id;
            element.itemPrice = parseFloat(element.itemPrice).toFixed(2);
            element.itemQuantity = parseFloat(element.itemQuantity).toFixed(2);
            let gstValue = parseFloat(element.gst).toFixed(2);
            // element.priceValidityValue = parseFloat(element.priceValidityValue).toFixed(2);
            element.discountValue = parseFloat(element.discountValue).toFixed(2);
            element.discountAmount = parseFloat(element.discountAmount).toFixed(2);

            // delete element.gst;
            // await RCTI_Items.updateOne(
            //     { _id: mongoose.Types.ObjectId(element.itemID) },
            //     { $set: element }
            // );

            element.gst = gstValue;
            element.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            element.recordType = "U";
            element.rctiID = post.rctiID;
            ItemsList.push(element);
            console.log("ItemsList: ", ItemsList);
        }
        if (ItemsList) {
            await RCTI_Items.deleteMany({ rctiID: mongoose.Types.ObjectId(post.rctiID) });
            let insertItems = await RCTI_Items.insertMany(ItemsList);

            if (insertItems) {
                let updateRCTI = null;
                post.recordType = "U";
                post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

                updateRCTI = await RCTI.updateOne(
                    { _id: mongoose.Types.ObjectId(post.rctiID) }, { $set: post }
                );

                console.log("updateRCTI :-", updateRCTI);

                if (post.documentName) {
                    if (!req.files) {
                        return res.status(200).json(genericResponse(false, "File is missing.", []));
                    }
                    const isDocumentExist = await RCTI_Documents.findOne({ rctiID: mongoose.Types.ObjectId(post.rctiID), documentName: post.documentName });
                    if (isDocumentExist) {
                        console.log("url", process.env.LOCATION_PATH + `${isDocumentExist.documentFileName}`);
                        var fs = require("fs");
                        fs.unlink(
                            process.env.LOCATION_PATH + `/${isDocumentExist.documentFileName}`,
                            function (err) {
                                if (err) {
                                    throw err;
                                }
                            }
                        );
                        const returnedFileName = await uploadRctiFile(req, post.documentName, "invoiceDocuments");
                        post.documentFileName = returnedFileName;
                        post.referenceFolder = "invoiceDocuments/" + post.rctiID.toString();
                        post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                        post.recordType = "U";
                        const existingDoc = await RCTI_Documents.findOneAndUpdate(
                            { rctiID: mongoose.Types.ObjectId(post.rctiID), documentName: post.documentName },
                            { $set: post },
                            { new: true, useFindAndModify: false }
                        );

                    }
                } else {
                    const returnedFileName = await uploadRctiFile(req, post.documentName, "invoiceDocuments");
                    post.documentFileName = returnedFileName;
                    post.referenceFolder = "invoiceDocuments/" + post.rctiID.toString();
                    post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                    const insertedDoc = await RCTI_Documents(post).save();
                }
            }
            if (updateRCTI.n === 1) {
                //Send Email to Customer if "post.hasQuo_DocumentFile" is true and quotationStatus is Pending only.
                // const fetchInvoice = await InvoiceModel.aggregate([
                //     { $match: { _id: mongoose.Types.ObjectId(post.invoiceID) } },
                //     {
                //         $lookup: {
                //             from: 'contacts',
                //             localField: "contactID",
                //             foreignField: "_id",
                //             as: "contact"
                //         }
                //     },
                //     { $unwind: '$contact' },
                //     {
                //         $project: {
                //             _id: 1,
                //             invoiceNumber: 1,
                //             invoiceStatus: 1,
                //             customerName: "$contact.name",
                //             customerEmail: "$contact.emailAddress",
                //             invoiceDate: {
                //                 $concat: [
                //                     {
                //                         $let: {
                //                             vars: {
                //                                 monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                //                             },
                //                             in: {
                //                                 $arrayElemAt: ['$$monthsInString', { $month: "$invoiceDate" }]
                //                             }
                //                         }
                //                     },
                //                     { $dateToString: { format: "%d", date: "$invoiceDate" } }, ", ",
                //                     { $dateToString: { format: "%Y", date: "$invoiceDate" } },
                //                 ]
                //             },
                //             dueDate: {
                //                 $concat: [
                //                     {
                //                         $let: {
                //                             vars: {
                //                                 monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                //                             },
                //                             in: {
                //                                 $arrayElemAt: ['$$monthsInString', { $month: "$dueDate" }]
                //                             }
                //                         }
                //                     },
                //                     { $dateToString: { format: "%d", date: "$dueDate" } }, ", ",
                //                     { $dateToString: { format: "%Y", date: "$dueDate" } },
                //                 ]
                //             },
                //         }
                //     },

                // ]);
                // if (fetchInvoice.length > 0 && (fetchInvoice[0].invoiceStatus === 'Unpaid' && post.hasQuo_DocumentFile)) {

                //     let emailSubject = '';
                //     let emailBody = '';
                //     const templateQuery = { templateStatus: 'Active', templateName: 'NewUnpaidInvoicesCustomerNotification' };
                //     const fetchedTemplates = await Templates.find(templateQuery);
                //     if (fetchedTemplates.length > 0) {
                //         let LINK = process.env.URL + "invoice/" + fetchInvoice[0].invoiceNumber + "/" + fetchInvoice[0]._id;
                //         let val = fetchedTemplates[0];

                //         val.templateSubject = val.templateSubject.replaceAll('[InvoiceNumber]', fetchInvoice[0].invoiceNumber);
                //         val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', fetchInvoice[0].customerName);
                //         emailSubject = val.templateSubject;

                //         val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', fetchInvoice[0].customerName);
                //         val.templateMessage = val.templateMessage.replaceAll('[InvoiceNumber]', fetchInvoice[0].invoiceNumber);
                //         val.templateMessage = val.templateMessage.replaceAll('[FinalAmount]', fetchInvoice[0].finalAmount);
                //         val.templateMessage = val.templateMessage.replaceAll('[InvoiceDate]', fetchInvoice[0].invoiceDate);
                //         val.templateMessage = val.templateMessage.replaceAll('[DueDate]', fetchInvoice[0].dueDate);
                //         val.templateMessage = val.templateMessage.replaceAll('[URL]', LINK);
                //         emailBody = val.templateMessage;
                //         await sendMailBySendGrid(fetchInvoice[0].customerEmail, emailSubject, emailBody);
                //         return res.status(200).json(genericResponse(true, "Invoice saved successfully and Email sent to the Customer's Email Address.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                //     } else {
                //         return res.status(200).json(genericResponse(true, "Invoice Saved successfully but Email not sent. Please configure the Email's templates.", { _id: post.invoiceID, hasQuo_DocumentFile: post.hasQuo_DocumentFile }));
                //     }
                // }
                // else {
                return res.status(200).json(genericResponse(true, "RCTI updated & saved successfully.", { _id: post.rctiID }));
                // }
            } else {
                return res.status(200).json(genericResponse(false, "RCTI not updated.", []));
            }

        } else {
            console.error("Items not inserted or encountered an error.");
            return res.status(200).json(genericResponse(false, "Items not inserted or encountered an error.", []));

        }
    } catch (error) {
        console.log("error in updateRcti==", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});


const fetchCustomerInInvoice = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchCustomerInInvoice post:", post);
        if (!post) {
            return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        }
        if (!post.businessUserID) {
            return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        }
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Customer", contactStatus: "Active" };

        const fetchContacts = await Contacts.find(query, { _id: 1, name: 1, });
        if (fetchContacts.length > 0) {
            let successResponse = genericResponse(true, "Customer Name fetched successfully.", fetchContacts);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Customer : Customer Name with Active Status is not found.", []);
            res.status(204).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchCustomerInInvoice =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchItemsForInvoice = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchItemsForInvoice 123", post);
        if (!post) { return res.status(202).json(genericResponse(false, "Request Payload Data is null", [])); }
        if (!post.businessUserID) { return res.status(202).json(genericResponse(false, "Business UserID is missing.", [])); }
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

        const fetchItemList = await items.aggregate([
            { $match: query },
            { $lookup: { from: "parameter_lists", localField: "gst", foreignField: "_id", as: "paramGST" } },
            { $unwind: "$paramGST" },
            {
                $project: {
                    gst: { $toInt: "$paramGST.parameterListName" },
                    priceValidity: 1,
                    priceValidityValue: 1,
                    discountType: 1,
                    discountValue: 1,
                    categoryID: 1,
                    itemName: 1,
                    itemCode: 1,
                    itemDescription: 1,
                    itemStatus: 1,
                    unitOfMeasurment: 1,
                    itemPrice: 1,
                    itemQuantity: 1,
                    businessUserID: 1,

                }
            }
        ]);
        if (fetchItemList.length > 0) {
            let successResponse = genericResponse(true, "Items Details fetched successfully.", fetchItemList);
            res.status(200).json(successResponse);
        } else {
            let errorResponse = genericResponse(false, "Items not Found.", []); res.status(200).json(errorResponse);
            return;
        }

    } catch (error) {
        console.log("error in fetchItemForInvoice =", error);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const uploadInvoiceDocument = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (!post.invoiceID)
            return res.status(200).json(genericResponse(false, "Invoice ID is missing.", []));
        if (!post.documentName)
            return res.status(200).json(genericResponse(false, "Document Name is missing.", []));
        if (!req.files)
            return res.status(200).json(genericResponse(false, "File is missing.", []));

        const isDocumentExist = await InvoiceDocuments.findOne({ invoiceID: mongoose.Types.ObjectId(post.invoiceID), documentName: post.documentName });
        if (isDocumentExist) {
            if (!post.documentID) {
                return res.status(200).json(genericResponse(false, "Document Name already exist.", []));
            } else {
                console.log("url", process.env.LOCATION_PATH + `${isDocumentExist.documentFileName}`);
                var fs = require("fs");
                fs.unlink(
                    process.env.LOCATION_PATH + `/${isDocumentExist.documentFileName}`,
                    function (err) {
                        if (err) {
                            throw err;
                        }
                    }
                );
                const returnedFileName = await uploadInvoiceFile(req, post.documentName, "invoiceDocuments");
                post.documentFileName = returnedFileName;
                post.referenceFolder = "invoiceDocuments/" + post.invoiceID.toString();
                post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                post.recordType = "U";
                const existingDoc = await InvoiceDocuments.findOneAndUpdate(
                    { invoiceID: mongoose.Types.ObjectId(post.invoiceID), documentName: post.documentName },
                    { $set: post },
                    { new: true, useFindAndModify: false }
                );

                if (existingDoc) {
                    const fetchDoc = await InvoiceDocuments.find({ invoiceID: mongoose.Types.ObjectId(post.invoiceID) },).sort({ uploadedDateTime: -1 });
                    return res.status(200).json(genericResponse(true, "File Updated successfully.", fetchDoc));
                } else {
                    return res.status(200).json(genericResponse(false, "File not updated successfully.", []));
                }
            }
        } else {
            const returnedFileName = await uploadQuotationFile(req, post.documentName, "invoiceDocuments");
            post.documentFileName = returnedFileName;
            post.referenceFolder = "invoiceDocuments/" + post.invoiceID.toString();
            post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            const insertedDoc = await InvoiceDocuments(post).save();
            if (insertedDoc._id !== null) {
                const fetchDoc = await InvoiceDocuments.find({ invoiceID: mongoose.Types.ObjectId(post.invoiceID) },).sort({ uploadedDateTime: -1 });
                return res.status(200).json(genericResponse(true, "File Added successfully.", fetchDoc));
            } else {
                return res.status(200).json(genericResponse(false, "File not added successfully.", []));
            }
        }
    } catch (error) {
        console.log("Error in uploadInvoiceDocument:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const deleteInvoiceDocument = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (!post.documentID) {
            return res.status(200).json(genericResponse(false, "Document ID is missing.", []));
        }
        const removeDoc = await InvoiceDocuments.deleteOne({ _id: mongoose.Types.ObjectId(req.body.documentID) });

        if (removeDoc.deletedCount > 0) {
            return res.status(200).json(genericResponse(true, "Document deleted Successfully.", []));
        } else {
            return res.status(200).json(genericResponse(false, "Document not deleted.", []));
        }
    } catch (error) {
        console.log("Error in deleteInvoiceDocument:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const fetchInvoices1 = asyncHandler(async (req, res) => {
    const post = req.body;
    // console.log("post",post)
    try {
        let query = {};
        // console.log("fetchInvoices", post)
        const fetched = await InvoiceModel.aggregate([
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                }
            },
            {
                $lookup: {
                    from: 'contacts',
                    localField: "contactID",
                    foreignField: "_id",
                    as: "contact"
                }
            },

            {
                $unwind: {
                    path: "$contact",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'quotations',
                    localField: "quotationID",
                    foreignField: "_id",
                    as: "quotation"
                }
            },
            {
                $unwind: {
                    path: "$quotation",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    _id: 1,
                    invoiceNumber: 1,
                    invoiceStatus: 1,
                    customerName: "$contact.name",
                    quotationName: "$quotation.quotationNumber",
                    invoiceDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$invoiceDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$invoiceDate" } }, ",",
                            { $dateToString: { format: "%Y", date: "$invoiceDate" } },
                        ]
                    },
                }
            },
            { $match: query },
        ]);

        let successResponse = genericResponse(true, "Invoices fetched successfully.", fetched);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("Error in fetchInvoices:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const fetchInvoiceDetailsByIDNew = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchInvoiceDetailsByID post:", post);
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { _id: mongoose.Types.ObjectId(post.invoiceID) };
        let fetch = await InvoiceModel.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "invoiceitems",
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "items",

                }
            },
            {
                $unwind: {
                    path: "$items",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "invoicedocuments",
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "invoiceDocuments",

                }
            },
            {
                $unwind: {
                    path: "$invoiceDocuments",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "contactID",
                    foreignField: "_id",
                    as: "contacts",

                }
            },
            {
                $unwind: {
                    path: "$contacts",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "invoice_retention_payments",
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "invoiceRetentionPayments",

                }
            },

            {
                $unwind: {
                    path: "$invoiceRetentionPayments",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $group: {
                    _id: "$_id",
                    items: { $first: "$items" },
                    invoiceDocuments: { $first: "$invoiceDocuments" },
                    quotationID: { $first: "$quotationID" },
                    invoiceNumber: { $first: "$invoiceNumber" },
                    contactID: { $first: "$contactID" },
                    contacts: { $first: "$contacts" },
                    validUpto: { $first: "$validUpto" },
                    invoiceType: { $first: "$invoiceType" },
                    dueDate: { $first: "$dueDate" },
                    dueUpto: { $first: "$dueUpto" },
                    invoiceDate: { $first: "$invoiceDate" },
                    purchaseOrderNumber: { $first: "$purchaseOrderNumber" },
                    invoiceStatus: { $first: "$invoiceStatus" },
                    gstType: { $first: "$gstType" },
                    totalAmount: { $first: "$totalAmount" },
                    totalDiscountAmount: { $first: "$totalDiscountAmount" },
                    finalAmount: { $first: "$finalAmount" },
                    scheduleRetention: { $first: "$scheduleRetention" },
                    paymentInstruction: { $first: "$paymentInstruction" },
                    invoiceRetentionPayments: { $push: "$invoiceRetentionPayments" },
                    invoiceRetentionPaymentsPaid: { $push: "$invoiceRetentionPaymentsPaid" },
                    invoiceRetentionPaymentsUnpaid: { $push: "$invoiceRetentionPaymentsUnpaid" },
                    payablePendingAmount: { $first: "$payablePendingAmount" },
                    invoicePayment: { $first: "$invoicePayment" },
                }
            },

            {
                $project: {
                    _id: 1,
                    items: 1,
                    invoiceDocuments: 1,
                    invoicePayment: 1,
                    quotationID: 1,
                    invoiceNumber: 1,
                    contactID: 1,
                    contacts: 1,
                    validUpto: 1,
                    scheduleRetention: 1,
                    invoiceType: 1,
                    dueDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$dueDate"
                        }
                    },
                    dueUpto: 1,
                    invoiceDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$invoiceDate"
                        }
                    },
                    purchaseOrderNumber: 1,
                    invoiceStatus: 1,
                    gstType: 1,
                    totalAmount: 1,
                    totalDiscountAmount: 1,
                    finalAmount: 1,
                    payablePendingAmount: 1,
                    paymentInstruction: 1,
                    invoiceRetentionPayments: "$invoiceRetentionPayments",
                    // invoiceRetentionPayments: {
                    //     $map: {
                    //         input: "$invoiceRetentionPayments",
                    //         as: "retentionPayment",
                    //         in: {
                    //             retentionDueDate: {
                    //                 $dateToString: {
                    //                     format: "%Y-%m-%d", // Specify the desired format here
                    //                     date: "$$retentionPayment.retentionDueDate"
                    //                 }
                    //             },
                    //             retentionPaymentAmount: "$$retentionPayment.retentionPaymentAmount",
                    //             retentionNumber: "$$retentionPayment.retentionNumber",
                    //             invoiceID: "$$retentionPayment.invoiceID",
                    //             _id: "$$retentionPayment._id",
                    //             retentionStatus: "$$retentionPayment.retentionStatus",
                    //             // Include other fields from invoiceRetentionPayments if needed
                    //         }
                    //     }
                    // },

                    // invoiceRetentionPaymentsPaid: {
                    //     $map: {
                    //         input: "$invoiceRetentionPayments",
                    //         as: "retentionPayment",
                    //         in: {
                    //             retentionDueDate: {
                    //                 $dateToString: {
                    //                     format: "%Y-%m-%d", // Specify the desired format here
                    //                     date: "$$retentionPayment.retentionDueDate"
                    //                 }
                    //             },
                    //             retentionPaymentAmount: "$$retentionPayment.retentionPaymentAmount",
                    //             retentionNumber: "$$retentionPayment.retentionNumber",
                    //             invoiceID: "$$retentionPayment.invoiceID",
                    //             _id: "$$retentionPayment._id",
                    //             retentionStatus: "$$retentionPayment.retentionStatus",
                    //             // Include other fields from invoiceRetentionPayments if needed
                    //         }
                    //     }
                    // },
                    // invoiceRetentionPaymentsUnpaid: {
                    //     $map: {
                    //         input: "$invoiceRetentionPaymentsUnpaid",
                    //         as: "retentionPayment",
                    //         in: {
                    //             retentionDueDate: {
                    //                 $dateToString: {
                    //                     format: "%Y-%m-%d", // Specify the desired format here
                    //                     date: "$$retentionPayment.retentionDueDate"
                    //                 }
                    //             },
                    //             retentionPaymentAmount: "$$retentionPayment.retentionPaymentAmount",
                    //             retentionNumber: "$$retentionPayment.retentionNumber",
                    //             invoiceID: "$$retentionPayment.invoiceID",
                    //             _id: "$$retentionPayment._id",
                    //             retentionStatus: "$$retentionPayment.retentionStatus",
                    //             // Include other fields from invoiceRetentionPayments if needed
                    //         }
                    //     }
                    // },

                },

            }


        ])
        if (fetch.length > 0) {
            console.log("fetchInvoiceDetailsByID fetch:", fetch);
            let successResponse = genericResponse(true, "Invoice details fetched successfully.", fetch);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Invoice details not found.", []);
            res.status(202).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchInvoiceDetailsByID =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});




export {
    fetchQuotationInInvoice,
    fetchQuotationByID,
    fetchCustomerInInvoice,
    fetchInvoices,
    addInvoice,
    fetchItemsForInvoice,
    fetchInvoiceDetailsByID,
    updateInvoice,
    uploadInvoiceDocument,
    deleteInvoiceDocument,
    fetchDebts,

    emailReminderInvoice,
    submitInvoicePaymentDetails,
    fetchInvoiceDetailsByIDNew,

    // RCTI
    fetchSupplierForRCTI,
    addRCTI,
    fetchRCTI,
    fetchRCTIDetailsByID,
    updateRCTI
}
