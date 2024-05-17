import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose';
import genericResponse from '../routes/genericWebResponses.js';
import BusinessUsers from '../models/businessUsersModel.js';

const fetchBusinessUserDashboardCardData = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("Sdf", post);
        if (!post.businessUserID) {
            return res.status(204).json(genericResponse(false, "Business User ID can't be blank.", []));
        }

        let duration = "Today"
        if (post.dashboardDuration) {
            duration = post.dashboardDuration;
        }
        const oneMonthAgo = new Date();
        oneMonthAgo.setUTCHours(0, 0, 0, 0);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        let startDate, endDate;
        if (duration == "Today") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else if (duration === "last 7 Days") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setDate(startDate.getDate() - 7);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else if (duration === "last 30 Days") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else if (duration === "12 months") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setFullYear(startDate.getFullYear() - 1);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);

        }
        else if (duration === "custom date") {

            let startDate = post.fromDate,
                endDate = post.toDate;
            startDate.setUTCHours(0, 0, 0, 0);
            endDate.setUTCHours(23, 59, 59, 999);
            endDate.setDate(endDate.getDate());
            console.log("qwert", startDate, endDate)
        }
        const result = await BusinessUsers.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
            },
            {
                $facet: {
                    "itemsCount": [

                        {
                            $lookup: {
                                from: 'items',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'items'
                            }
                        },
                        { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },

                        {
                            $group: {
                                _id: "$_id",
                                totalItemCount: { $sum: 1 },

                                totalItemCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$items.createdDate", startDate] },
                                                    { $lt: ["$items.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                }
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalItemCount: "$totalItemCountAsDuration",
                            }
                        },
                    ],
                    "invoicesCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'invoices',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'invoices'
                            }
                        },
                        { $unwind: "$invoices" },
                        {
                            $lookup: {
                                from: "invoice_retention_payments",
                                localField: "invoices._id",
                                foreignField: "invoiceID",
                                pipeline: [{
                                    $project: {
                                        createdDate: 0, lastModifiedDate: 0, recordType: 0, __v: 0
                                    }
                                }],
                                as: "Retention"
                            }
                        },
                        { $unwind: { path: "$Retention", preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: {
                                    invoiceNumber: "$invoices.invoiceNumber",
                                    invoiceAmount: "$invoices.finalAmount",
                                    totalInvoiceCount: { $sum: 1 },
                                    totalDebtCount: {
                                        $cond: [
                                            { $lt: ["$invoices.dueDate", new Date()] },
                                            1,
                                            0
                                        ]
                                    },

                                    totalInvoiceCountAsDuration: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $gte: ["$invoices.dueDate", new Date()] },
                                                    { $gte: ["$invoices.createdDate", startDate] },
                                                    { $lt: ["$invoices.createdDate", endDate] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },
                                    totalDebtCountAsDuration: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $lt: ["$invoices.dueDate", new Date()] },
                                                    { $gte: ["$invoices.createdDate", startDate] },
                                                    { $lt: ["$invoices.createdDate", endDate] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },


                                },
                                totalPaidInvoicesAmountAsDuration: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$invoices.scheduleRetention", true] },
                                            {
                                                $cond: [
                                                    {
                                                        $and: [
                                                            { $eq: ["$Retention.retentionStatus", "Paid"] },
                                                            { $gte: ["$Retention.retentionPaymentDate", startDate] },
                                                            { $lt: ["$Retention.retentionPaymentDate", endDate] }
                                                        ]
                                                    },
                                                    "$Retention.retentionPaymentAmount",
                                                    0
                                                ]
                                            },
                                            {
                                                $sum: {
                                                    $reduce: {
                                                        input: "$invoices.invoicePayment",
                                                        initialValue: 0,
                                                        in: {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $gte: ["$$this.paymentDate", startDate] },
                                                                        { $lt: ["$$this.paymentDate", endDate] }
                                                                    ]
                                                                },
                                                                { $add: ["$$value", "$$this.paymentAmount"] },
                                                                "$$value"
                                                            ]
                                                        }
                                                    }
                                                }
                                            }

                                        ]
                                    }

                                },
                                totalUnpaidInvoicesAmountAsDuration: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$invoices.scheduleRetention", true] },
                                            {
                                                $cond: [
                                                    {
                                                        $and: [
                                                            { $eq: ["$Retention.retentionStatus", "Unpaid"] },
                                                            { $gte: ["$Retention.retentionPaymentDate", startDate] },
                                                            { $lt: ["$Retention.retentionPaymentDate", endDate] }
                                                        ]
                                                    },
                                                    "$Retention.retentionPaymentAmount",
                                                    0
                                                ]
                                            },
                                            {
                                                $sum: {
                                                    $reduce: {
                                                        input: "$invoices.invoicePayment",
                                                        initialValue: 0,
                                                        in: {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $gte: ["$$this.paymentDate", startDate] },
                                                                        { $lt: ["$$this.paymentDate", endDate] }
                                                                    ]
                                                                },
                                                                { $add: ["$$value", "$$this.paymentAmount"] },
                                                                "$$value"
                                                            ]
                                                        }
                                                    }
                                                }
                                            }

                                        ]
                                    }

                                },

                            }
                        },

                        {
                            $group: {
                                _id: 0,
                                totalInvoiceCount: { $sum: "$_id.totalInvoiceCount" },
                                totalDebtCount: { $sum: "$_id.totalDebtCount" },

                                InvoiceCount: { $sum: "$_id.totalInvoiceCountAsDuration" },
                                DebtCount: { $sum: "$_id.totalDebtCountAsDuration" },
                                TotalPaidAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$totalPaidInvoicesAmountAsDuration", null] }, 0, "$totalPaidInvoicesAmountAsDuration"]
                                    }
                                },
                                TotalUnpaidAmount: { $sum: "$totalUnpaidInvoicesAmountAsDuration" },
                                TotalPaidAmountLast: { $sum: "$totalPaidInvoicesAmountAsLastDurationFilter" },

                            }
                        },
                        {
                            $project: {
                                TotalPaidAmount: "$TotalPaidAmount",
                                TotalUnpaidAmount: "$TotalUnpaidAmount",
                                TotalInvoiceCount: "$InvoiceCount",
                                TotalDebtCount: "$DebtCount",

                            }
                        }
                    ],
                    "quotationsCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'quotations',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'quotations'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$quotations",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalQuotationCount: { $sum: 1 },
                                totalQuotationCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$quotations.createdDate", startDate] },
                                                    { $lt: ["$quotations.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },

                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalQuotationCount: "$totalQuotationCountAsDuration",

                            }
                        }
                    ],
                    "rctiCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },

                        {
                            $lookup: {
                                from: 'rctis',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'rctis'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$rctis",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalRctiAmountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Paid"] },
                                                    { $gte: ["$rctis.paymentDate", startDate] },
                                                    { $lt: ["$rctis.paymentDate", endDate] }
                                                ]
                                            }, then: "$rctis.finalAmount", else: 0
                                        }
                                    }

                                },
                                totalRctiUnpaidAmountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                                    {
                                                        $or: [
                                                            {
                                                                $and: [
                                                                    { $gte: ["$rctis.createdDate", new Date(startDate)] },
                                                                    { $lt: ["$rctis.createdDate", new Date(endDate)] }
                                                                ]
                                                            },
                                                            {
                                                                $and: [
                                                                    { $gte: ["$rctis.lastModifiedDate", new Date(startDate)] },
                                                                    { $lt: ["$rctis.lastModifiedDate", new Date(endDate)] }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            then: "$rctis.finalAmount",
                                            else: 0
                                        }
                                    }


                                },
                                totalRctiCount: { $sum: 1 },
                                totalRCTICountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$rctis.createdDate", startDate] },
                                                    { $lt: ["$rctis.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },

                                totalUnpaidRctiCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                totalUnpaidRCTICountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                                    { $gte: ["$rctis.createdDate", startDate] },
                                                    { $lt: ["$rctis.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                                totalUnpaidRctiCountLastMonth: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                                    { $gte: ["$rctis.createdDate", oneMonthAgo] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalRctiAmount: "$totalRctiAmountAsDuration",
                                TotalRctiUnpaidAmount: "$totalRctiUnpaidAmountAsDuration",
                                TotalRctiCount: "$totalRCTICountAsDuration",
                                TotalUnpaidRctiCount: "$totalUnpaidRCTICountAsDuration",

                            }
                        }
                    ],
                    "usersCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'users'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$users",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalUserCount: { $sum: 1 },

                                totalUserCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$users.createdDate", startDate] },
                                                    { $lt: ["$users.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalUserCount: "$totalUserCountAsDuration",

                            }
                        }
                    ],
                    "contactsCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'contacts',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'contacts'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$contacts",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $match: {
                                $or: [
                                    { "contacts.contactType": "Customer" },
                                    { "contacts.contactType": "Supplier" },
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalCustomerCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$contacts.contactType", "Customer"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                totalCustomerCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$contacts.contactType", "Customer"] },
                                                    { $gte: ["$contacts.createdDate", startDate] },
                                                    { $lt: ["$contacts.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                                totalSupplierCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$contacts.contactType", "Supplier"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                totalSupplierCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$contacts.contactType", "Supplier"] },
                                                    { $gte: ["$contacts.createdDate", startDate] },
                                                    { $lt: ["$contacts.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalCustomerCount: "$totalCustomerCountAsDuration",
                                TotalSupplierCount: "$totalSupplierCountAsDuration",
                            }
                        }
                    ],
                }
            },

        ]);

        // Extracting the desired fields from the result
        const extractedResult = result.map(item => ({
            TotalItemCount: item.itemsCount[0].TotalItemCount,
            TotalPaidAmount: item.invoicesCount[0].TotalPaidAmount,
            TotalUnpaidAmount: item.invoicesCount[0].TotalUnpaidAmount,
            TotalInvoiceCount: item.invoicesCount[0].TotalInvoiceCount,
            TotalDebtCount: item.invoicesCount[0].TotalDebtCount,
            TotalQuotationCount: item.quotationsCount[0].TotalQuotationCount,
            TotalRctiAmount: item.rctiCount[0].TotalRctiAmount,
            TotalRctiUnpaidAmount: item.rctiCount[0].TotalRctiUnpaidAmount,
            TotalRctiCount: item.rctiCount[0].TotalRctiCount,
            TotalUnpaidRctiCount: item.rctiCount[0].TotalUnpaidRctiCount,
            TotalUserCount: item.usersCount[0].TotalUserCount,
            TotalCustomerCount: item.contactsCount[0].TotalCustomerCount,
            TotalSupplierCount: item.contactsCount[0].TotalSupplierCount,

        }));
        if (extractedResult.length > 0) {
            console.log("extractedResult", extractedResult);
            const successResponse = genericResponse(true, "Data fetched successfully", extractedResult);
            res.status(200).json(successResponse);

        }
    } catch (error) {
        console.log("err", error)
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchBusinessUserDashboardCardDataTest = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("Sdf", post);
        if (!post.businessUserID) {
            return res.status(204).json(genericResponse(false, "Business User ID can't be blank.", []));
        }

        let duration = "Today"
        if (post.dashboardDuration) {
            duration = post.dashboardDuration;
        }
        const oneMonthAgo = new Date();
        oneMonthAgo.setUTCHours(0, 0, 0, 0);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        let startDate, endDate;
        if (duration == "Today") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else if (duration === "last 7 Days") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setDate(startDate.getDate() - 7);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else if (duration === "last 30 Days") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else if (duration === "12 months") {
            startDate = new Date();
            startDate.setUTCHours(0, 0, 0, 0);
            startDate.setFullYear(startDate.getFullYear() - 1);
            endDate = new Date();
            endDate.setUTCHours(23, 59, 59, 999);

        }
        else if (duration === "custom date") {

            let startDate = post.fromDate,
                endDate = post.toDate;
            startDate.setUTCHours(0, 0, 0, 0);
            endDate.setUTCHours(23, 59, 59, 999);
            endDate.setDate(endDate.getDate());
            console.log("qwert", startDate, endDate)
        }
        const result = await BusinessUsers.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
            },
            {
                $facet: {
                    "itemsCount": [

                        {
                            $lookup: {
                                from: 'items',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'items'
                            }
                        },
                        { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },

                        {
                            $group: {
                                _id: "$_id",
                                totalItemCount: { $sum: 1 },

                                totalItemCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$items.createdDate", startDate] },
                                                    { $lt: ["$items.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                }
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalItemCount: "$totalItemCountAsDuration",
                            }
                        },
                    ],
                    "invoicesCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'invoices',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'invoices'
                            }
                        },
                        { $unwind: "$invoices" },
                        {
                            $lookup: {
                                from: "invoice_retention_payments",
                                localField: "invoices._id",
                                foreignField: "invoiceID",
                                pipeline: [{
                                    $project: {
                                        createdDate: 0, lastModifiedDate: 0, recordType: 0, __v: 0
                                    }
                                }],
                                as: "Retention"
                            }
                        },
                        { $unwind: { path: "$Retention", preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: {
                                    invoiceNumber: "$invoices.invoiceNumber",
                                    invoiceAmount: "$invoices.finalAmount",
                                    totalInvoiceCount: { $sum: 1 },
                                    totalDebtCount: {
                                        $cond: [
                                            { $lt: ["$invoices.dueDate", new Date()] },
                                            1,
                                            0
                                        ]
                                    },

                                    totalInvoiceCountAsDuration: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $gte: ["$invoices.dueDate", new Date()] },
                                                    { $gte: ["$invoices.createdDate", startDate] },
                                                    { $lt: ["$invoices.createdDate", endDate] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },
                                    totalDebtCountAsDuration: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $lt: ["$invoices.dueDate", new Date()] },
                                                    { $gte: ["$invoices.createdDate", startDate] },
                                                    { $lt: ["$invoices.createdDate", endDate] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },

                                },
                                totalPaidInvoicesAmountAsDuration: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$invoices.scheduleRetention", true] },
                                            {
                                                $cond: [
                                                    {
                                                        $and: [
                                                            { $eq: ["$Retention.retentionStatus", "Paid"] },
                                                            { $gte: ["$Retention.retentionPaymentDate", startDate] },
                                                            { $lt: ["$Retention.retentionPaymentDate", endDate] }
                                                        ]
                                                    },
                                                    "$Retention.retentionPaymentAmount",
                                                    0
                                                ]
                                            },
                                            {
                                                $sum: {
                                                    $reduce: {
                                                        input: "$invoices.invoicePayment",
                                                        initialValue: 0,
                                                        in: {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $gte: ["$$this.paymentDate", startDate] },
                                                                        { $lt: ["$$this.paymentDate", endDate] }
                                                                    ]
                                                                },
                                                                { $add: ["$$value", "$$this.paymentAmount"] },
                                                                "$$value"
                                                            ]
                                                        }
                                                    }
                                                }
                                            }

                                        ]
                                    }

                                },
                                totalUnpaidInvoicesAmountAsDuration: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$invoices.scheduleRetention", true] },
                                            {
                                                $cond: [
                                                    {
                                                        $and: [
                                                            { $eq: ["$Retention.retentionStatus", "Unpaid"] },
                                                            { $gte: ["$Retention.retentionPaymentDate", startDate] },
                                                            { $lt: ["$Retention.retentionPaymentDate", endDate] }
                                                        ]
                                                    },
                                                    "$Retention.retentionPaymentAmount",
                                                    0
                                                ]
                                            },
                                            {
                                                $sum: {
                                                    $reduce: {
                                                        input: "$invoices.invoicePayment",
                                                        initialValue: 0,
                                                        in: {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $gte: ["$$this.paymentDate", startDate] },
                                                                        { $lt: ["$$this.paymentDate", endDate] }
                                                                    ]
                                                                },
                                                                { $add: ["$$value", "$$this.paymentAmount"] },
                                                                "$$value"
                                                            ]
                                                        }
                                                    }
                                                }
                                            }

                                        ]
                                    }

                                },
                                totalInvoiceCountAsDueDatePassedCount: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $lt: ["$invoices.dueDate", new Date()] }, // Due date is passed
                                                    { $gte: ["$invoices.createdDate", startDate] }, // Created date is within range
                                                    { $lt: ["$invoices.createdDate", endDate] } // Created date is within range
                                                ]
                                            },
                                            1, // Count if condition is true
                                            0 // Otherwise, count 0
                                        ]
                                    }
                                }

                            }
                        },

                        {
                            $group: {
                                _id: 0,
                                totalInvoiceCount: { $sum: "$_id.totalInvoiceCount" },
                                totalDebtCount: { $sum: "$_id.totalDebtCount" },

                                InvoiceCount: { $sum: "$_id.totalInvoiceCountAsDuration" },
                                DebtCount: { $sum: "$_id.totalDebtCountAsDuration" },
                                TotalPaidAmount: { $sum: "$totalPaidInvoicesAmountAsDuration" },
                                TotalUnpaidAmount: { $sum: "$totalUnpaidInvoicesAmountAsDuration" },
                                TotalPaidAmountLast: { $sum: "$totalPaidInvoicesAmountAsLastDurationFilter" },
                                totalInvoiceCountAsDueDatePassedCount: { $sum: "$totalInvoiceCountAsDueDatePassedCount" },
                            }
                        },
                        {
                            $project: {
                                TotalPaidAmount: "$TotalPaidAmount",
                                TotalUnpaidAmount: "$TotalUnpaidAmount",
                                TotalInvoiceCount: "$InvoiceCount",
                                TotalDebtCount: "$DebtCount",
                                totalInvoiceCountAsDueDatePassedCount: "$totalInvoiceCountAsDueDatePassedCount",
                            }
                        }
                    ],
                    "quotationsCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'quotations',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'quotations'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$quotations",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalQuotationCount: { $sum: 1 },
                                totalQuotationCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$quotations.createdDate", startDate] },
                                                    { $lt: ["$quotations.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                                totalQuotationCountAsAccepted: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$quotations.quotationStatus", "Accepted"] },
                                                    { $gte: ["$quotations.createdDate", startDate] },
                                                    { $lt: ["$quotations.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalQuotationCount: "$totalQuotationCountAsDuration",
                                totalQuotationCountAsAccepted: "$totalQuotationCountAsAccepted",
                            }
                        }
                    ],
                    "rctiCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },

                        {
                            $lookup: {
                                from: 'rctis',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'rctis'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$rctis",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalRctiAmountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Paid"] },
                                                    { $gte: ["$rctis.paymentDate", startDate] },
                                                    { $lt: ["$rctis.paymentDate", endDate] }
                                                ]
                                            }, then: "$rctis.finalAmount", else: 0
                                        }
                                    }

                                },
                                totalRctiUnpaidAmountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                                    {
                                                        $or: [
                                                            {
                                                                $and: [
                                                                    { $gte: ["$rctis.createdDate", new Date(startDate)] },
                                                                    { $lt: ["$rctis.createdDate", new Date(endDate)] }
                                                                ]
                                                            },
                                                            {
                                                                $and: [
                                                                    { $gte: ["$rctis.lastModifiedDate", new Date(startDate)] },
                                                                    { $lt: ["$rctis.lastModifiedDate", new Date(endDate)] }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            then: "$rctis.finalAmount",
                                            else: 0
                                        }
                                    }


                                },
                                totalRctiCount: { $sum: 1 },
                                totalRCTICountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$rctis.createdDate", startDate] },
                                                    { $lt: ["$rctis.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },

                                totalUnpaidRctiCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                totalUnpaidRCTICountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                                    { $gte: ["$rctis.createdDate", startDate] },
                                                    { $lt: ["$rctis.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                                totalUnpaidRctiCountLastMonth: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$rctis.rctiStatus", "Unpaid"] },
                                                    { $gte: ["$rctis.createdDate", oneMonthAgo] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalRctiAmount: "$totalRctiAmountAsDuration",
                                TotalRctiUnpaidAmount: "$totalRctiUnpaidAmountAsDuration",
                                TotalRctiCount: "$totalRCTICountAsDuration",
                                TotalUnpaidRctiCount: "$totalUnpaidRCTICountAsDuration",

                            }
                        }
                    ],
                    "usersCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'users'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$users",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalUserCount: { $sum: 1 },

                                totalUserCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $gte: ["$users.createdDate", startDate] },
                                                    { $lt: ["$users.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalUserCount: "$totalUserCountAsDuration",

                            }
                        }
                    ],
                    "contactsCount": [
                        {
                            $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'contacts',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'contacts'
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$contacts",
                                "preserveNullAndEmptyArrays": true
                            }
                        },
                        {
                            $match: {
                                $or: [
                                    { "contacts.contactType": "Customer" },
                                    { "contacts.contactType": "Supplier" },
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                totalCustomerCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$contacts.contactType", "Customer"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                totalCustomerCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$contacts.contactType", "Customer"] },
                                                    { $gte: ["$contacts.createdDate", startDate] },
                                                    { $lt: ["$contacts.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                                totalSupplierCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$contacts.contactType", "Supplier"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                totalSupplierCountAsDuration: {
                                    $sum: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $eq: ["$contacts.contactType", "Supplier"] },
                                                    { $gte: ["$contacts.createdDate", startDate] },
                                                    { $lt: ["$contacts.createdDate", endDate] }
                                                ]
                                            }, then: 1, else: 0
                                        }
                                    }

                                },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                TotalCustomerCount: "$totalCustomerCountAsDuration",
                                TotalSupplierCount: "$totalSupplierCountAsDuration",
                            }
                        }
                    ],
                }
            },

        ]);

        // Extracting the desired fields from the result
        // const extractedResult = result.map(item => ({
        //     TotalItemCount: item.itemsCount[0].TotalItemCount,
        //     TotalPaidAmount: item.invoicesCount[0].TotalPaidAmount,
        //     TotalUnpaidAmount: item.invoicesCount[0].TotalUnpaidAmount,
        //     TotalInvoiceCount: item.invoicesCount[0].TotalInvoiceCount,
        //     TotalDebtCount: item.invoicesCount[0].TotalDebtCount,
        //     TotalQuotationCount: item.quotationsCount[0].TotalQuotationCount,
        //     TotalRctiAmount: item.rctiCount[0].TotalRctiAmount,
        //     TotalRctiUnpaidAmount: item.rctiCount[0].TotalRctiUnpaidAmount,
        //     TotalRctiCount: item.rctiCount[0].TotalRctiCount,
        //     TotalUnpaidRctiCount: item.rctiCount[0].TotalUnpaidRctiCount,
        //     TotalUserCount: item.usersCount[0].TotalUserCount,
        //     TotalCustomerCount: item.contactsCount[0].TotalCustomerCount,
        //     TotalSupplierCount: item.contactsCount[0].TotalSupplierCount,

        // }));
        if (result.length > 0) {
            const successResponse = genericResponse(true, "Data fetched successfully", result);
            res.status(200).json(successResponse);

        }
    } catch (error) {
        console.log("err", error)
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

export {
    fetchBusinessUserDashboardCardData,
    fetchBusinessUserDashboardCardDataTest
}