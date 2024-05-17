import asyncHandler from 'express-async-handler'

import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import Contacts from '../models/contactModel.js';
import ContactOtherEmails from '../models/contactOtherEmailsModel.js';
import { generateSearchParameterList, getNextSequenceValue, sendMailBySendGrid, uploadImageFile, uploadQuotationFile, validateEmail } from '../routes/genericMethods.js';
import DefaultSetting from '../models/defaultSettingsModel.js';
import items from '../models/itemsModel.js';
import Quotations from '../models/quotationModel.js';
import QuotationItems from '../models/quotationItemsModel.js';
import QuotationDocuments from '../models/quotationdocumentsModel.js';
import Templates from '../models/templatesModel.js';
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
      let errorRespnse = genericResponse(false, "Contact: Customer Name with Active Status is not found.", []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log("error in fetchContactsForQuotation =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const getQuotationNumberFromSetting = asyncHandler(async (req, res) => {
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

const fetchQuotation = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('fetchQuotation(post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    if (!post.businessUserID || post.businessUserID === 'undefined') {
      console.log('Business User ID ISSUE')
      let errorMessage = " Business User ID can't be ";
      errorMessage += post.businessUserID ? "blank." : "undefined.";
      let errorResponse = genericResponse(false, errorMessage, []);
      return res.status(204).json(errorResponse);
    }
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }

    // const fetchUser = await Quotations.find(query)
    const fetchUser = await Quotations.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "contacts",
          localField: "contactID",
          foreignField: "_id",
          as: "contacts"
        }
      },
      { $unwind: '$contacts' },
      {
        $project: {
          contactName: "$contacts.name",
          quotationDates: "$quotationDate",
          quotationNumber: 1,
          finalAmount: 1,
          quotationStatus: 1,
          businessUserID: 1,
          quotationDate: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$quotationDate" // Assuming this is your date field
                  },
                  in: {
                    $concat: [
                      {
                        $arrayElemAt: ['$$monthsInString', { $subtract: [{ $month: "$$date" }, 1] }]
                      },
                      " ",
                      {
                        $concat: [
                          {
                            $substr: [{ $dayOfMonth: "$$date" }, 0, -1]
                          },
                          ", ",
                          {
                            $dateToString: {
                              format: "%Y %H:%M:%S",
                              date: "$$date"
                            }
                          },
                          " ",
                          {
                            $cond: {
                              if: { $gte: [{ $hour: "$$date" }, 12] },
                              then: "PM",
                              else: "AM"
                            }
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          },
          quotationDateString: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                  },
                  in: {
                    $arrayElemAt: ['$$monthsInString', { $month: "$quotationDate" }]
                  }
                }
              },
              { $dateToString: { format: "%d", date: "$quotationDate" } }, ", ",
              { $dateToString: { format: "%Y", date: "$quotationDate" } },
            ]
          },
        }
      },

    ])
    // console.log('fetchUser(post)', fetchUser)
    let successResponse = genericResponse(true, "Quotations fetched successfully.", fetchUser);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Quotations=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

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

const addQuotation = asyncHandler(async (req, res) => {
  const post = req.body;
  console.log('addQuotation (post)', post)
  console.log('files (post)', req.files)
  if (post.signatureKey !== process.env.SIGNATURE_KEY) {
    return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
  }
  try {

    //  insert a new Quotation 
    const fetchQuotation = await DefaultSetting.findOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) }, { quotationPrefix: 1, quotationStartNumber: 1, currencyValue: 1 });
    if (fetchQuotation && fetchQuotation.quotationPrefix && fetchQuotation.quotationStartNumber) {
      const QuotationStartNumber = await getNextSequenceValue("quotationNumber", post.businessUserID, fetchQuotation.quotationStartNumber);
      console.log("new Q Number: ", fetchQuotation.quotationPrefix + QuotationStartNumber);
      post.quotationNumber = fetchQuotation.quotationPrefix + QuotationStartNumber;
      post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "I";
      post.quotationStatus = "Pending";
      post.currencyValue = fetchQuotation.currencyValue;
      const addedQuotation = await new Quotations(post).save();

      if (addedQuotation._id !== null) {
        console.log("addedQuotation._id ", addedQuotation._id);
        let QID = addedQuotation._id;
        if (post.itemID) {
          const itemIDs = JSON.parse(post.itemID);
          for (let ID of itemIDs) {
            let fetchItems = await items.findOne({ _id: mongoose.Types.ObjectId(ID) });
            delete fetchItems._id
            if (fetchItems) {
              const modifiedItems = {
                ...fetchItems.toObject(), // Convert fetchItems to a plain JavaScript object
                createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
                recordType: "I",
                itemID: fetchItems._id,
                quotationID: addedQuotation._id
              };
              delete modifiedItems._id
              delete modifiedItems.lastModifiedDate
              console.log("modifiedItems ", modifiedItems);
              const inserted = await QuotationItems(modifiedItems).save();
            }
          }
        }

        if (req.files !== null) {
          const DocumentName = JSON.parse(post.DocumentName);
          console.log("DocumentName", DocumentName);
          const returnedFileName = await uploadQuotationFile(req, DocumentName, "quotationDocuments", QID);
          post.documentFileName = returnedFileName;
          console.log("documentFileName", post.documentFileName);
          post.quotationID = addedQuotation._id;
          post.documentName = DocumentName;
          post.referenceFolder = "quotationDocuments/" + post.quotationID.toString();
          post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          const insertedDoc = await QuotationDocuments(post).save();
        }

        // let SendEmailFlag = false;
        // if (post.sendEmailFlag) {
        //   SendEmailFlag = true;
        //   post.hasQuo_DocumentFile = true; // if user click save&SendEmail, true this checked important change
        // }

        // if (post.sendEmailFlag = true) {
        //   const fetchQuotation = await Quotations.aggregate([
        //     { $match: { _id: mongoose.Types.ObjectId(QID) } },
        //     {
        //       $lookup: {
        //         from: 'contacts',
        //         localField: "contactID",
        //         foreignField: "_id",
        //         as: "contact"
        //       }
        //     },
        //     { $unwind: '$contact' },
        //     {
        //       $project: {
        //         _id: 1,
        //         quotationNumber: 1,
        //         quotationStatus: 1,
        //         customerName: "$contact.name",
        //         customerEmail: "$contact.emailAddress",
        //         otherEmailAddress: "$contact.otherEmailAddress",
        //         quotationDate: {
        //           $concat: [
        //             {
        //               $let: {
        //                 vars: {
        //                   monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
        //                 },
        //                 in: {
        //                   $arrayElemAt: ['$$monthsInString', { $month: "$quotationDate" }]
        //                 }
        //               }
        //             },
        //             { $dateToString: { format: "%d", date: "$quotationDate" } }, ", ",
        //             { $dateToString: { format: "%Y", date: "$quotationDate" } },
        //           ]
        //         },
        //         validUptoDate: {
        //           $concat: [
        //             {
        //               $let: {
        //                 vars: {
        //                   monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
        //                 },
        //                 in: {
        //                   $arrayElemAt: ['$$monthsInString', { $month: "$validUptoDate" }]
        //                 }
        //               }
        //             },
        //             { $dateToString: { format: "%d", date: "$validUptoDate" } }, ", ",
        //             { $dateToString: { format: "%Y", date: "$validUptoDate" } },
        //           ]
        //         },
        //       }
        //     },

        //   ]);
        //   if (fetchQuotation && fetchQuotation.length > 0 && (fetchQuotation[0].quotationStatus === 'Pending')) {
        //     let CustomerEmail = [];
        //     CustomerEmail.push(fetchQuotation[0].customerEmail);
        //     if (fetchQuotation[0].otherEmailAddress && fetchQuotation[0].otherEmailAddress.length > 0) {
        //       fetchQuotation[0].otherEmailAddress.forEach(email => {
        //         if (validateEmail(email)) {
        //           CustomerEmail.push(email);
        //         }
        //       });
        //     }
        //     let emailSubject = '';
        //     let emailBody = '';
        //     const templateQuery = { templateStatus: 'Active', templateName: 'QuotationLinkToCustomer' };
        //     const fetchedTemplates = await Templates.find(templateQuery);
        //     if (fetchedTemplates.length > 0) {
        //       let LINK = process.env.URLPROD + "/" + "quotation/" + fetchQuotation[0].quotationNumber + "/" + fetchQuotation[0]._id;
        //       let val = fetchedTemplates[0];

        //       val.templateSubject = val.templateSubject.replaceAll('[QuotationNumber]', fetchQuotation[0].quotationNumber);
        //       val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', fetchQuotation[0].customerName);
        //       emailSubject = val.templateSubject;

        //       val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', fetchQuotation[0].customerName);
        //       val.templateMessage = val.templateMessage.replaceAll('[QuotationNumber]', fetchQuotation[0].quotationNumber);
        //       val.templateMessage = val.templateMessage.replaceAll('[QuotationStatus]', fetchQuotation[0].quotationStatus);
        //       val.templateMessage = val.templateMessage.replaceAll('[QuotationDate]', fetchQuotation[0].quotationDate);
        //       val.templateMessage = val.templateMessage.replaceAll('[ValidUptoDate]', fetchQuotation[0].validUptoDate);
        //       val.templateMessage = val.templateMessage.replaceAll('[link]', LINK);
        //       emailBody = val.templateMessage;
        //       await sendMailBySendGrid(CustomerEmail, emailSubject, emailBody);
        //       return res.status(200).json(genericResponse(true, "Quotation Details Saved Successfully and Email sent to the Customer's Email Address.", { _id: post.quotationID, hasQuo_DocumentFile: true }));
        //     } else {
        //       return res.status(200).json(genericResponse(false, "Quotation Details Saved Successfully but Email not sent. Please configure the Email's templates.", { _id: post.quotationID, hasQuo_DocumentFile: true }));
        //     }
        //   }
        // }


        console.log("addedQuotation ", addedQuotation);
        let successResponse = genericResponse(true, "Q Added successfully.", addedQuotation);
        return res.status(200).json(successResponse);
      } else {
        return res.status(200).json(genericResponse(false, "Q not added.", []));
      }
    } else {
      return res.status(200).json(genericResponse(false, "Please check your default settings and ensure that quotationPrefix & quotationStartNumber are Added or not.", []));
    }
  } catch (error) {
    console.log("error in addQuotation=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchQuotationDetailsByID = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    console.log("fetchQuotationDetailsByID post:", post);
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
      // {
      //   $lookup: {
      //     from: "items",
      //     localField: "quotationitems.itemID",
      //     foreignField: "_id",
      //     as: "itemsNew",
      //   }
      // },
      {
        $lookup: {
          from: "quotationdocuments",
          localField: "_id",
          foreignField: "quotationID",
          as: "quotationDocuments",
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
        $project: {
          items: {
            $map: {
              "input": "$items",
              as: "item",
              in: {
                "_id": "$$item.itemID",
                "itemQuantity": "$$item.itemQuantity",
                "itemPrice": "$$item.itemPrice",
                "discountValue": "$$item.discountValue",
                "discountType": "$$item.discountType",
              }
            }
          },//Array of Items
          // itemsNew: 1, //Array of Items
          quotationDocuments: 1, //Array of Quotation Doc.
          contacts: 1, //Array of Quotation Doc.
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
          paymentInstructions: 1,
          description: 1
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
    console.log("updateQuotation post: ", post);

    if (!post.quotationID) {
      return res.status(204).json(genericResponse(false, "Quotation ID is missing.", []));
    }

    if (post.itemID) {
      console.log("post.itemID ", post.itemID);
      const removePreviousItems = await QuotationItems.deleteMany({ quotationID: mongoose.Types.ObjectId(post.quotationID) });
      const itemIDs = JSON.parse(post.itemID);
      console.log("itemIDs ", itemIDs);
      for (let ID of itemIDs) {
        let fetchItems = await items.findOne({ _id: mongoose.Types.ObjectId(ID) });
        console.log("fetchItems ", fetchItems);

        if (fetchItems) {
          const modifiedItems = {
            ...fetchItems.toObject(), // Convert fetchItems to a plain JavaScript object
            createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
            recordType: "I",
            itemID: fetchItems._id,
            quotationID: post.quotationID
          };
          delete modifiedItems._id
          delete modifiedItems.lastModifiedDate

          const inserted = await QuotationItems(modifiedItems).save();
        }
      }

      post.totalAmount = parseFloat(post.totalAmount).toFixed(2);
      if (post.totalDiscountAmount) {
        post.totalDiscountAmount = parseFloat(post.totalDiscountAmount).toFixed(2);
      }

      post.finalAmount = parseFloat(post.finalAmount).toFixed(2);
      post.recordType = "U";
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

      const updatedQuotation = await Quotations.updateOne(
        { _id: mongoose.Types.ObjectId(post.quotationID) }, { $set: post }
      )
      let QID = post.quotationID
      console.log("req.files ", req.files);
      if (req.files !== null) {

        const isDocumentExist = await QuotationDocuments.findOne({ quotationID: mongoose.Types.ObjectId(post.quotationID), documentName: post.documentName });
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

          const returnedFileName = await uploadQuotationFile(req, post.documentName, "quotationDocuments", QID);
          post.documentFileName = returnedFileName;
          post.uploadedDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          post.recordType = "U";
          const existingDoc = await QuotationDocuments.findOneAndUpdate(
            { quotationID: mongoose.Types.ObjectId(post.quotationID), documentName: post.documentName },
            { $set: post },
            { new: true, useFindAndModify: false }
          );
        }
      }

      // let SendEmailFlag = false;
      // if (post.sendEmailFlag) {
      //   SendEmailFlag = true;
      //   post.hasQuo_DocumentFile = true; // if user click save&SendEmail, true this checked important change
      // }

      // if (post.sendEmailFlag = true) {
      //   const fetchQuotation = await Quotations.aggregate([
      //     { $match: { _id: mongoose.Types.ObjectId(QID) } },
      //     {
      //       $lookup: {
      //         from: 'contacts',
      //         localField: "contactID",
      //         foreignField: "_id",
      //         as: "contact"
      //       }
      //     },
      //     { $unwind: '$contact' },
      //     {
      //       $project: {
      //         _id: 1,
      //         quotationNumber: 1,
      //         quotationStatus: 1,
      //         customerName: "$contact.name",
      //         customerEmail: "$contact.emailAddress",
      //         otherEmailAddress: "$contact.otherEmailAddress",
      //         quotationDate: {
      //           $concat: [
      //             {
      //               $let: {
      //                 vars: {
      //                   monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
      //                 },
      //                 in: {
      //                   $arrayElemAt: ['$$monthsInString', { $month: "$quotationDate" }]
      //                 }
      //               }
      //             },
      //             { $dateToString: { format: "%d", date: "$quotationDate" } }, ", ",
      //             { $dateToString: { format: "%Y", date: "$quotationDate" } },
      //           ]
      //         },
      //         validUptoDate: {
      //           $concat: [
      //             {
      //               $let: {
      //                 vars: {
      //                   monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
      //                 },
      //                 in: {
      //                   $arrayElemAt: ['$$monthsInString', { $month: "$validUptoDate" }]
      //                 }
      //               }
      //             },
      //             { $dateToString: { format: "%d", date: "$validUptoDate" } }, ", ",
      //             { $dateToString: { format: "%Y", date: "$validUptoDate" } },
      //           ]
      //         },
      //       }
      //     },

      //   ]);
      //   if (fetchQuotation && fetchQuotation.length > 0 && (fetchQuotation[0].quotationStatus === 'Pending')) {
      //     let CustomerEmail = [];
      //     CustomerEmail.push(fetchQuotation[0].customerEmail);
      //     if (fetchQuotation[0].otherEmailAddress && fetchQuotation[0].otherEmailAddress.length > 0) {
      //       fetchQuotation[0].otherEmailAddress.forEach(email => {
      //         if (validateEmail(email)) {
      //           CustomerEmail.push(email);
      //         }
      //       });
      //     }
      //     let emailSubject = '';
      //     let emailBody = '';
      //     const templateQuery = { templateStatus: 'Active', templateName: 'QuotationLinkToCustomer' };
      //     const fetchedTemplates = await Templates.find(templateQuery);
      //     if (fetchedTemplates.length > 0) {
      //       let LINK = process.env.URLPROD + "/" + "quotation/" + fetchQuotation[0].quotationNumber + "/" + fetchQuotation[0]._id;
      //       let val = fetchedTemplates[0];

      //       val.templateSubject = val.templateSubject.replaceAll('[QuotationNumber]', fetchQuotation[0].quotationNumber);
      //       val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', fetchQuotation[0].customerName);
      //       emailSubject = val.templateSubject;

      //       val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', fetchQuotation[0].customerName);
      //       val.templateMessage = val.templateMessage.replaceAll('[QuotationNumber]', fetchQuotation[0].quotationNumber);
      //       val.templateMessage = val.templateMessage.replaceAll('[QuotationStatus]', fetchQuotation[0].quotationStatus);
      //       val.templateMessage = val.templateMessage.replaceAll('[QuotationDate]', fetchQuotation[0].quotationDate);
      //       val.templateMessage = val.templateMessage.replaceAll('[ValidUptoDate]', fetchQuotation[0].validUptoDate);
      //       val.templateMessage = val.templateMessage.replaceAll('[link]', LINK);
      //       emailBody = val.templateMessage;
      //       await sendMailBySendGrid(CustomerEmail, emailSubject, emailBody);
      //       return res.status(200).json(genericResponse(true, "Quotation Details Saved Successfully and Email sent to the Customer's Email Address.", { _id: post.quotationID, hasQuo_DocumentFile: true }));
      //     } else {
      //       return res.status(200).json(genericResponse(false, "Quotation Details Saved Successfully but Email not sent. Please configure the Email's templates.", { _id: post.quotationID, hasQuo_DocumentFile: true }));
      //     }
      //   }
      // }

      if (updatedQuotation.ok === 1) {
        return res.status(200).json(genericResponse(true, "Quotation updated Successfully.", { _id: post.quotationID }));
      } else {
        return res.status(204).json(genericResponse(false, "Quotation not updated.", []));
      }


    } else {
      return res.status(204).json(genericResponse(false, "Items are missing without items quotation can't be updated.", []));
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

const deleteQuotationDocument = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (!post.documentID) {
      return res.status(200).json(genericResponse(false, "Document ID is missing.", []));
    }
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

const emailReminderQuotation = asyncHandler(async (req, res) => {
  try {
    let post = req.body;
    console.log("post:emailReminderQuotation ", post);

    if (!post.quotationID) {
      return res.status(200).json(genericResponse(false, "quotation ID is missing.", []));
    }

    const fetchQuotation = await Quotations.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(post.quotationID) } },
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
        $project: {
          _id: 1,
          quotationNumber: 1,
          quotationStatus: 1,
          customerName: "$contact.name",
          customerEmail: "$contact.emailAddress",
          otherEmailAddress: "$contact.otherEmailAddress",
          quotationDate: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                  },
                  in: {
                    $arrayElemAt: ['$$monthsInString', { $month: "$quotationDate" }]
                  }
                }
              },
              { $dateToString: { format: "%d", date: "$quotationDate" } }, ", ",
              { $dateToString: { format: "%Y", date: "$quotationDate" } },
            ]
          },
          validUptoDate: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                  },
                  in: {
                    $arrayElemAt: ['$$monthsInString', { $month: "$validUptoDate" }]
                  }
                }
              },
              { $dateToString: { format: "%d", date: "$validUptoDate" } }, ", ",
              { $dateToString: { format: "%Y", date: "$validUptoDate" } },
            ]
          },
        }
      },

    ]);
    console.log("fetchQuotation ", fetchQuotation);

    if (fetchQuotation.length > 0 && (fetchQuotation[0].quotationStatus === 'Pending')) {
      let CustomerEmail = [];
      CustomerEmail.push(fetchQuotation[0].customerEmail);
      if (fetchQuotation[0].otherEmailAddress && fetchQuotation[0].otherEmailAddress.length > 0) {
        fetchQuotation[0].otherEmailAddress.forEach(email => {
          if (validateEmail(email)) {
            CustomerEmail.push(email);
          }
        });
      }
      let emailSubject = '';
      let emailBody = '';
      const templateQuery = { templateStatus: 'Active', templateName: 'QuotationLinkToCustomer' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let LINK = process.env.URLPROD + "/" + "quotation/" + fetchQuotation[0].quotationNumber + "/" + fetchQuotation[0]._id;
        let val = fetchedTemplates[0];

        val.templateSubject = val.templateSubject.replaceAll('[QuotationNumber]', fetchQuotation[0].quotationNumber);
        val.templateSubject = val.templateSubject.replaceAll('[CustomerName]', fetchQuotation[0].customerName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[CustomerName]', fetchQuotation[0].customerName);
        val.templateMessage = val.templateMessage.replaceAll('[QuotationNumber]', fetchQuotation[0].quotationNumber);
        val.templateMessage = val.templateMessage.replaceAll('[QuotationStatus]', fetchQuotation[0].quotationStatus);
        val.templateMessage = val.templateMessage.replaceAll('[QuotationDate]', fetchQuotation[0].quotationDate);
        val.templateMessage = val.templateMessage.replaceAll('[ValidUptoDate]', fetchQuotation[0].validUptoDate);
        val.templateMessage = val.templateMessage.replaceAll('[link]', LINK);
        emailBody = val.templateMessage;
        await sendMailBySendGrid(CustomerEmail, emailSubject, emailBody);
        return res.status(200).json(genericResponse(true, "Quotation Details Saved Successfully and Email sent to the Customer's Email Address.", { _id: post.quotationID, hasQuo_DocumentFile: true }));
      } else {
        return res.status(200).json(genericResponse(false, "Quotation Details Saved Successfully but Email not sent. Please configure the Email's templates.", { _id: post.quotationID, hasQuo_DocumentFile: true }));
      }
    }


  } catch (error) {
    console.log("error in emailInvoice =", error.message);
    return res.status(400).json(genericResponse(false, error.message, []));
  }
});

const viewFile = asyncHandler(async (req, res) => {
  try {
    let fileName = req.query.fileName;
    var options = {
      root: process.env.LOCATION_PATH,
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      },
      status: genericResponse(true, "File viewed successfully.", [])
    }
    res.sendFile(fileName, options, function (error) {
      try {
        if (error) {
          let errorRespnse = genericResponse(false, error.message, []);
          res.status(200).json(errorRespnse);
        }
      } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
      }
    })
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});


export {
  fetchContactsForQuotation,
  getQuotationNumberFromSetting,
  fetchDetailsOnAddQuotationScreen,

  fetchContactsInQuotation,
  addQuotation,
  fetchQuotationDetailsByID,
  updateQuotation,
  uploadQuotationDocument,
  deleteQuotationDocument,
  fetchQuotation,
  emailReminderQuotation,
  viewFile

}
