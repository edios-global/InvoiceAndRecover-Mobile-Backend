import asyncHandler from "express-async-handler";
import genericResponse from "../routes/genericWebResponses.js";
import mongoose from 'mongoose';
import Contacts from "../models/contactModel.js";
import RCTI from "../models/rctiModel.js";

const fetchRCTIReportData = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {};
        let sort = {};

        let currentDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
        let tomorrowDate = new Date(new Date().setUTCHours(0, 0, 0, 0));


        let activationsearchDate;

        if (post.rctiDuration !== "All") {
            if (post.rctiDuration === "Today") {
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tomorrowDate) }
            }
            if (post.rctiDuration === "last7Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 7);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.rctiDuration === "last30Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 30);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.rctiDuration === "last1Year") {
                tomorrowDate.setFullYear(tomorrowDate.getFullYear() - 1);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
        }

        if (post.rctiDuration !== "" && post.rctiDuration !== undefined) {
            query.rctiDate = activationsearchDate
        }

        let fetchQuery = [
            { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID) } },
            {
                $lookup: {
                    from: 'rcti_items',
                    localField: '_id',
                    foreignField: 'rctiID',
                    as: 'rctiItems'
                }
            },
            { $unwind: '$rctiItems' },
            {
                $lookup: {
                    from: 'items',
                    localField: 'rctiItems.itemID',
                    foreignField: '_id',
                    as: 'items'
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'supplierID',
                    foreignField: '_id',
                    as: 'contacts'
                }
            },
            { $unwind: '$contacts' },
            {
                $project: {
                    _id: 1,
                    supplierName: "$contacts.name",
                    rctiDate: "$rctiDate",
                    rctiNumber: "$rctiNumber",
                    rctiStatus: "$rctiStatus",
                    gstType: "$gstType",
                    totalAmount: { $toString: "$totalAmount" },
                    totalDiscountAmount: { $toString: "$totalDiscountAmount" },
                    finalAmount: { $toString: "$finalAmount" },
                    paymentInstruction: "$paymentInstruction",
                    purchaseOrderNumber: "$purchaseOrderNumber",
                    itemName: "$items.itemName",
                    itemPrice: { $toString: "$rctiItems.itemPrice" },
                    itemQuantity: { $toString: "$rctiItems.itemQuantity" },
                    discountType: "$rctiItems.discountType",
                    discountvalue: "$rctiItems.discountValue",
                    discountAmount: { $toString: "$rctiItems.discountAmount" },
                    gst: { $toString: "$rctiItems.gst" },
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
                    rctiDateString: {
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
                }
            },
        ];
        if (post.rctiStatus !== "") {
            query.rctiStatus = post.rctiStatus
        }
        if (post.customerName !== "" && post.customerName !== undefined) {
            query.customerName = post.customerName
        }
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        let myAggregation = RCTI.aggregate(fetchQuery);
        myAggregation._pipeline = fetchQuery;
        RCTI.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "RCTI Report Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "RCTI Report fetched successfully", result);
                    res.status(200).json(successResponse);
                }
            }
        );
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchRCTIContacts = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        let query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Supplier" };

        const fetchContact = await Contacts.find(query, { name: 1 })
        if (fetchContact.length > 0) {
            let successResponse = genericResponse(true, "fetchInvoiceContacts fetched successfully.", fetchContact);
            res.status(200).json(successResponse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export { fetchRCTIReportData, fetchRCTIContacts };
