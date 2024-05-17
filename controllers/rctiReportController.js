import asyncHandler from "express-async-handler";
import genericResponse from "../routes/genericWebResponses.js";
import mongoose from 'mongoose';
import Contacts from "../models/contactModel.js";
import RCTI from "../models/rctiModel.js";

const fetchRCTIReportData = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        let sort = {};
        console.log("fetchRCTIReportData(post)", post);
        let currentDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
        let tomorrowDate = new Date(new Date().setUTCHours(0, 0, 0, 0));

        let activationsearchDate;

        if (post.rctiDuration !== "All") {
            if (post.rctiDuration === "Today") {
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tomorrowDate) }
            }
            if (post.rctiDuration === "last 7 Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 7);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.rctiDuration === "last 30 Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 30);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.rctiDuration === "12 months") {
                tomorrowDate.setFullYear(tomorrowDate.getFullYear() - 1);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.rctiDuration === "custom date") {
                let fromDate = new Date(post.fromDate);
                let toDate = new Date(post.toDate);
                fromDate.setUTCHours(0, 0, 0, 0);
                toDate.setUTCHours(0, 0, 0, 0);
                toDate.setDate(toDate.getDate() + 1);
                console.log("custom date", fromDate, toDate)
                activationsearchDate = { $gte: fromDate, $lt: toDate }
            }
        }

        if (post.rctiDuration !== "" && post.rctiDuration !== undefined) {
            query.rctiDate = activationsearchDate
            console.log(" query.rctiDate (post)", query.rctiDate);
        }

        let fetchQuery = [

            {
                $lookup: {
                    from: 'rcti_items',
                    localField: '_id',
                    foreignField: 'rctiID',
                    as: 'rctiItems'
                }
            },
            // { $unwind: '$rctiItems' },
            { $unwind: { path: "$rctiItems", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'items',
                    localField: 'rctiItems.itemID',
                    foreignField: '_id',
                    as: 'items'
                }
            },
            // { $unwind: '$items' },
            { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'supplierID',
                    foreignField: '_id',
                    as: 'contacts'
                }
            },
            // { $unwind: '$contacts' },
            { $unwind: { path: "$contacts", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    supplierName: "$contacts.name",
                    businessUserID: "$businessUserID",
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
                    dueDate2: {
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
                    dueDate: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Specify the desired format here
                            date: "$dueDate"
                        }
                    },
                    dueDate1: {
                        $dateToString: {
                            format: "%d-%m-%Y", // Specify the desired format here
                            date: "$dueDate"
                        }
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
            { $match: query },
        ];

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
