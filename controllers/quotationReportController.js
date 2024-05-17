import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Quotations from "../models/quotationModel.js";
import Contacts from '../models/contactModel.js';


const fetchQuotationReportData = asyncHandler(async (req, res) => {
    try {
        const post = req.body
        console.log("post", post)
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
        let sort = {}

        let currentDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
        let tomorrowDate = new Date(new Date().setUTCHours(0, 0, 0, 0));



        let activationsearchDate;

        if (post.quotationDuration !== "All") {
            if (post.quotationDuration === "Today") {
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tomorrowDate) }
            }
            if (post.quotationDuration === "last 7 Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 7);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.quotationDuration === "last 30 Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 30);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.quotationDuration === "12 months") {
                tomorrowDate.setFullYear(tomorrowDate.getFullYear() - 1);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.quotationDuration === "custom date") {
                let fromDate = new Date(post.fromDate);
                let toDate = new Date(post.toDate);
                fromDate.setUTCHours(0, 0, 0, 0);
                toDate.setUTCHours(0, 0, 0, 0) + 1;
                toDate.setDate(toDate.getDate() + 1);
                console.log("qwert", fromDate, toDate)
                activationsearchDate = { $gte: fromDate, $lt: toDate }
            }
        }

        if (post.quotationDuration !== "" && post.quotationDuration !== undefined) {
            query.quotationDate = activationsearchDate
        }

        let fetchData = await Quotations.aggregate(
            [
                { $match: query },
                {
                    $lookup: {
                        from: 'quotationitems',
                        localField: '_id',
                        foreignField: 'quotationID',
                        as: 'quotationitems'
                    }
                },
                { $unwind: { path: "$quotationitems", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'items',
                        localField: 'quotationitems.itemID',
                        foreignField: '_id',
                        as: 'items'
                    }
                },
                { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'contacts',
                        localField: 'contactID',
                        foreignField: '_id',
                        as: 'contacts'
                    }
                },
                { $unwind: { path: "$contacts", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        customerName: "$contacts.name",
                        quotationDate: "$quotationDate",
                        quotationNumber: "$quotationNumber",
                        quotationSequenceNumber: "$quotationSequenceNumber",
                        quotationStatus: "$quotationStatus",
                        gstType: "$gstType",
                        totalAmount: "$totalAmount",
                        totalDiscountAmount: "$totalDiscountAmount",
                        finalAmount: "$finalAmount",
                        paymentInstruction: "$paymentInstruction",
                        purchaseOrderNumber: "$purchaseOrderNumber",
                        itemName: "$items.itemName",
                        itemPrice: "$quotationitems.itemPrice",
                        itemQuantity: "$quotationitems.itemQuantity",
                        priceValidity: "$quotationitems.priceValidity",
                        priceValidityValue: "$quotationitems.priceValidityValue",
                        discountType: "$quotationitems.discountType",
                        discountvalue: "$quotationitems.discountValue",
                        discountAmount: "$quotationitems.discountAmount",
                        gst: "$quotationitems.gst",
                        validUptoDate: {
                            $dateToString: {
                                format: "%Y-%m-%d", // Specify the desired format here
                                date: "$validUptoDate"
                            }
                        },
                        validUptoDate1: {
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
            ]
        );
        console.log("fetchData Count", fetchData, fetchData.length)
        if (fetchData.length > 0) {
            let successResponse = genericResponse(true, "fetch Quotation Report Data fetched successfully.", fetchData);
            res.status(200).json(successResponse);
            return;
        } else {
            let successResponse = genericResponse(true, "No Quotation Report Data found.", []);
            res.status(200).json(successResponse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchQuotationContacts = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        let query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

        const fetchContact = await Contacts.find(query, {
            name: 1,
            contactType: "Customer"
        })
        if (fetchContact.length > 0) {
            let successResponse = genericResponse(true, "fetchQuotationContacts fetched successfully.", fetchContact);
            res.status(200).json(successResponse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export {
    fetchQuotationReportData, fetchQuotationContacts,
}