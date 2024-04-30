import asyncHandler from 'express-async-handler'

import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import Contacts from '../models/contactModel.js';
import ContactOtherEmails from '../models/contactOtherEmailsModel.js';
import { generateSearchParameterList, uploadImageFile } from '../routes/genericMethods.js';
import DefaultSetting from '../models/defaultSettingsModel.js';
import items from '../models/itemsModel.js';
import Quotations from '../models/quotationModel.js';
import QuotationItems from '../models/quotationItemsModel.js';
import QuotationDocuments from '../models/quotationdocumentsModel.js';
const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const fetchContactsForQuotation = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchContactsForQuotation post:", post);
        if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Customer", contactStatus: "Active" };

        const fetchContacts = await Contacts.find(query, { _id: 1, name: 1, });
        if (fetchContacts.length > 0) {
            let successResponse = genericResponse(true, "Contact Name fetched successfully.", fetchContacts);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Contact : Customer Name with Active Status is not found.", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchContactsForQuotation =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const getQuatationNumberFromSetting = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        // console.log("fetchContactsForQuotation post:", post);
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

        const fetch = await DefaultSetting.findOne(query, { quotationPrefix: 1, quotationStartNumber: 1, });
        if (fetch && fetch.quotationPrefix && fetch.quotationStartNumber) {

            let successResponse = genericResponse(true, "Quotation Number fetched successfully.", { quotationNumber: fetch.quotationPrefix + fetch.quotationStartNumber });
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Please check your default settings and ensure that quotationPrefix, quotationStartNumber are present.", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in getQuatationNumberFromSetting =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchDetailsOnAddQuotationScreen = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        // console.log("fetchContactsForQuotation post:", post);
        if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));

        let fetchContacts = [];
        let fetchItems = [];
        var itemQuery = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), itemStatus: "Active" };
        var contactQuery = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Customer", contactStatus: "Active" };


        fetchContacts = await Contacts.find(contactQuery, { _id: 1, companyName: 1, name: 1 });

        fetchItems = await items.find(itemQuery);
        let successResponse = genericResponse(true, "Contact Name fetched successfully.", fetchContacts,);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log("error in fetchDetailsOnAddQuotationScreeen =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

// Mobile API ------------->

const fetchContactsInQuotation = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchContactsForQuotation post:", post);
        if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Customer", contactStatus: "Active" };

        const fetchContacts = await Contacts.find(query, { _id: 1, name: 1, });
        if (fetchContacts.length > 0) {
            let successResponse = genericResponse(true, "Contact Name fetched successfully.", fetchContacts);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Contact : Customer Name with Active Status is not found.", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchContactsForQuotation =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const addQuotations = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log('addQuotations (post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    try {

        const addData = await new Quotations(post).save();
        const successResponse = genericResponse(true, "add Quotations Successfully", addData);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in addQuotations=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchQuotationDetailsByID = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        // console.log("fetchContactsForQuotation post:", post);
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { _id: mongoose.Types.ObjectId(post.quotationID) };
        // var query = { _id: mongoose.Types.ObjectId("65db4087637dac30c41c117d") };
        let fetch = await Quotations.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "quotationitems",
                    localField: "_id",
                    foreignField: "quotationID",
                    as: "items",

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
                $project: {
                    items: 1, //Array of Items
                    quotationDocuments: 1, //Array of Quotation Doc.
                    quotationNumber: 1,
                    contactID: 1,
                    validUpto: 1,
                    validUptoDate: 1,
                    quotationDate: 1,
                    purchaseOrderNumber: 1,
                    quotationStatus: 1,
                    gstType: 1,
                    totalAmount: 1,
                    totalDiscountAmount: 1,
                    finalAmount: 1,
                    paymentInstruction: 1,
                }
            }

        ])
        if (fetch.length > 0) {
            // console.log("fetchQuotationDetailsByID fetch:", fetch);
            let successResponse = genericResponse(true, "Quotation details fetched successfully.", fetch);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Quotation details not found.", []);
            res.status(202).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchQuotationDetailsByID =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateQuotation = asyncHandler(async (req, res) => {
    try {
        let post = req.body;
        delete post._id;
        console.log("updateQuotation req.body: ", req.body);

        if (!post.quotationID) {
            return res.status(200).json(genericResponse(false, "Quotation ID is missing.", []));
        }

        let ItemsList = [];
        for (const element of post.itemsList) {
            delete element._id;
            element.itemPrice = parseFloat(element.itemPrice).toFixed(2);
            element.itemQuantity = parseFloat(element.itemQuantity).toFixed(2);
            element.gst = parseFloat(element.gst).toFixed(2);
            element.priceValidityValue = parseFloat(element.priceValidityValue).toFixed(2);
            element.discountValue = parseFloat(element.discountValue).toFixed(2);
            element.discountAmount = parseFloat(element.discountAmount).toFixed(2);

            const itemsUpdated = await items.updateOne(
                { _id: mongoose.Types.ObjectId(element.itemID) },
                { $set: element }
            );
            console.log("itemsUpdated: ", itemsUpdated);

            element.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            element.recordType = "I";
            element.quotationID = post.quotationID;
            ItemsList.push(element);
            console.log("ItemsList: ", ItemsList);
        }
        if (ItemsList.length > 0) {
            const removePreviousItems = await QuotationItems.deleteMany({ quotationID: mongoose.Types.ObjectId(post.quotationID) });
            console.log("removePrevious Items", removePreviousItems);
            // if (removePreviousItems.deletedCount > 0 || removePreviousItems.n < 0) {
            let insertItems = await QuotationItems.insertMany(ItemsList);
            console.log("insertItems: ", insertItems);
            if (insertItems && insertItems.length > 0) {
                post.totalAmount = parseFloat(post.totalAmount).toFixed(2);
                post.totalDiscountAmount = parseFloat(post.totalDiscountAmount).toFixed(2);
                post.finalAmount = parseFloat(post.finalAmount).toFixed(2);
                post.recordType = "U";
                post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                const updatedQuotation = await Quotations.updateOne(
                    { _id: mongoose.Types.ObjectId(post.quotationID) }, { $set: post }
                )
                if (updatedQuotation.ok === 1) {
                    return res.status(200).json(genericResponse(true, "Quotation updated Successfully.", { _id: post.quotationID }));
                } else {
                    return res.status(200).json(genericResponse(false, "Quotation not updated.", []));
                }

            } else {
                console.error("Items not inserted or encountered an error.");
                return res.status(200).json(genericResponse(false, "Items not inserted or encountered an error.", []));

            }

        } else {
            return res.status(200).json(genericResponse(false, "Items are missing without items quotation can't be updated.", []));
        }

    } catch (error) {
        console.log("error in updatedQuotation =", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const uploadQuotationDocument = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (!post.quotationID)
            return res.status(200).json(genericResponse(false, "Quotation ID is missing.", []));
        if (!post.documentName)
            return res.status(200).json(genericResponse(false, "Document Name is missing.", []));
        if (!req.files)
            return res.status(200).json(genericResponse(false, "File is missing.", []));

        const isDocumentExist = await QuotationDocuments.findOne({ quotationID: mongoose.Types.ObjectId(post.quotationID), documentName: post.documentName });
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
                const returnedFileName = await uploadQuotationFile(req, post.documentName, "quotationDocuments");
                post.documentFileName = returnedFileName;
                post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                post.recordType = "U";
                const existingDoc = await QuotationDocuments.findOneAndUpdate(
                    { quotationID: mongoose.Types.ObjectId(post.quotationID), documentName: post.documentName },
                    { $set: post },
                    { new: true, useFindAndModify: false }
                );

                if (existingDoc) {
                    const fetchDoc = await QuotationDocuments.find({ quotationID: mongoose.Types.ObjectId(post.quotationID) },).sort({ uploadedDateTime: -1 });
                    return res.status(200).json(genericResponse(true, "File Updated successfully.", fetchDoc));
                } else {
                    return res.status(200).json(genericResponse(false, "File not updated successfully.", []));
                }
            }
        } else {
            const returnedFileName = await uploadQuotationFile(req, post.documentName, "quotationDocuments");
            post.documentFileName = returnedFileName;
            post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            const insertedDoc = await QuotationDocuments(post).save();
            if (insertedDoc._id !== null) {
                const fetchDoc = await QuotationDocuments.find({ quotationID: mongoose.Types.ObjectId(post.quotationID) },).sort({ uploadedDateTime: -1 });
                return res.status(200).json(genericResponse(true, "File Added successfully.", fetchDoc));
            } else {
                return res.status(200).json(genericResponse(false, "File not added successfully.", []));
            }
        }



    } catch (error) {
        console.log("Error in uploadQuotationFile:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

const viewUploadedQuotationDocument = asyncHandler(async (req, res) => {
    try {
        let fileName = req.query.fileName;

        let options = {
            root: process.env.LOCATION_PATH,
            dotfiles: 'deny',
            headers: { 'x-timestamp': Date.now(), 'x-sent': true },
            status: genericResponse(true, "File viewed successfully.", [])
        }
        console.log("viewFile")
        res.sendFile(fileName, options, function (error) {
            try {
                if (error) {
                    let errorRespnse = genericResponse(false, error.message, []);
                    return res.status(400).json(errorRespnse);
                }
            } catch (error) {
                let errorRespnse = genericResponse(false, error.message, []);
                return res.status(400).json(errorRespnse);
            }
        })
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        return res.status(505).json(errorRespnse);
    }
});

const deleteQuotationDocument = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (!post.documentID) return res.status(200).json(genericResponse(false, "Document ID is missing.", []));

        const removeDoc = await QuotationDocuments.deleteOne({ _id: mongoose.Types.ObjectId(req.body.documentID) });
        console.log("removeDoc:", removeDoc);
        if (removeDoc.deletedCount > 0) {
            return res.status(200).json(genericResponse(true, "Document deleted Successfully.", []));
        } else {
            return res.status(200).json(genericResponse(false, "Document not deleted.", []));
        }
    } catch (error) {
        console.log("Error in deleteQuotationDocument:", error.message);
        return res.status(400).json(genericResponse(false, error.message, []));
    }
});

// const aaa1 = asyncHandler(async (req, res) => {
//   try {
//     let post = req.body;
//     console.log("addQuotation req.body: ", req.body);
//     // it will insert a new Quotation      
//     const fetchQuotation = await DefaultSetting.findOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) }, { quotationPrefix: 1, quotationStartNumber: 1, });
//     if (fetchQuotation && fetchQuotation.quotationPrefix && fetchQuotation.quotationStartNumber) {
//       const QuotationStartNumber = await getNextSequenceValue("quotationNumber", post.businessUserID, fetchQuotation.quotationStartNumber);
//       console.log("mysteryNumber: ", fetchQuotation.quotationPrefix + QuotationStartNumber);

//       post.quotationNumber = fetchQuotation.quotationPrefix + QuotationStartNumber;
//       post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//       post.recordType = "I";
//       const addedQuotation = await new Quotations(post).save();
//       if (addedQuotation._id !== null) {
//         let successResponse = genericResponse(true, "Quotation added successfully.", addedQuotation);
//         return res.status(200).json(successResponse);
//       } else {
//         return res.status(200).json(genericResponse(false, "Quotation not added.", []));
//       }
//     } else {
//       return res.status(200).json(genericResponse(false, "Please check your default settings and ensure that quotationPrefix, quotationStartNumber are present.", []));
//     }

//   } catch (error) {
//     console.log("error in addQuotation =", error.message);
//     return res.status(400).json(genericResponse(false, error.message, []));
//   }
// });


export {
    fetchContactsForQuotation, getQuatationNumberFromSetting, fetchDetailsOnAddQuotationScreen,

    fetchContactsInQuotation,
    addQuotations

}
