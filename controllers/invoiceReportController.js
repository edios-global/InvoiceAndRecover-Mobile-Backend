import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Contacts from '../models/contactModel.js';
import Invoices from '../models/invoiceModel.js';
import InvoiceModel from '../models/invoiceModel.js';
import { generateSearchParameterList } from '../routes/genericMethods.js';


const fetchInvoiceReportData = asyncHandler(async (req, res) => {
    try {
        const post = req.body
        var query = {}
        let sort = {}
        console.log("fetchInvoiceReportData(post)", post);
        let currentDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
        let tomorrowDate = new Date(new Date().setUTCHours(0, 0, 0, 0));

        let activationsearchDate;

        if (post.invoiceDuration !== "All") {
            if (post.invoiceDuration === "Today") {
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tomorrowDate) }
            }
            if (post.invoiceDuration === "last7Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 7);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.invoiceDuration === "last30Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 30);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.invoiceDuration === "last1Year") {
                tomorrowDate.setFullYear(tomorrowDate.getFullYear() - 1);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
        }

        if (post.invoiceDuration !== "" && post.invoiceDuration !== undefined) {
            query.invoiceDate = activationsearchDate
        }

        let fetchQuery = [
            { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID) } },
            {
                $lookup: {
                    from: 'invoiceitems',
                    localField: '_id',
                    foreignField: 'invoiceID',
                    as: 'invoiceitems'
                }
            },
            { $unwind: '$invoiceitems' },
            {
                $lookup: {
                    from: 'items',
                    localField: 'invoiceitems.itemID',
                    foreignField: '_id',
                    as: 'items'
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'contactID',
                    foreignField: '_id',
                    as: 'contacts'
                }
            },
            { $unwind: '$contacts' },
            {
                $project: {
                    _id: 1,
                    customerName: "$contacts.name",
                    invoiceDate: "$invoiceDate",
                    invoiceNumber: "$invoiceNumber",
                    invoiceStatus: "$invoiceStatus",
                    gstType: "$gstType",
                    totalAmount: "$totalAmount",
                    totalDiscountAmount: "$totalDiscountAmount",
                    finalAmount: "$finalAmount",
                    paymentInstruction: "$paymentInstruction",
                    purchaseOrderNumber: "$purchaseOrderNumber",
                    itemName: "$items.itemName",
                    itemPrice: "$invoiceitems.itemPrice",
                    itemQuantity: "$invoiceitems.itemQuantity",
                    discountType: "$invoiceitems.discountType",
                    discountvalue: "$invoiceitems.discountValue",
                    discountAmount: "$invoiceitems.discountAmount",
                    gst: "$invoiceitems.gst",
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
                }
            },
        ];
        if (post.invoiceStatus !== "") {
            query.invoiceStatus = post.invoiceStatus
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
        let myAggregation = InvoiceModel.aggregate(fetchQuery);
        myAggregation._pipeline = fetchQuery;
        Invoices.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Invoice Report Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Invoice Report fetched successfully", result);
                    res.status(200).json(successResponse);
                }
            }
        );
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchInvoiceContacts = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        let query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

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

export {
    fetchInvoiceReportData, fetchInvoiceContacts,
}