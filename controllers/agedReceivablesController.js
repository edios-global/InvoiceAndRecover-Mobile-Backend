//Bharat Shah
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from "../routes/genericMethods.js";
import Invoices from '../models/invoiceModel.js';



function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
const fetchAgedReceivables = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("<<POST>>", post.customDate)
        let sort = {}
        if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
        const searchQuery = {};
        if (post.filterValues != undefined && post.filterValues != '') {
            searchQuery.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        }
        let currentDate = new Date();
        let durationDate;
        console.log("currentDate", currentDate);
        switch (post.duration) {
            case "Custom":
                const custom = new Date(post.customDate);
                durationDate = formatDate(custom);
                break;
            case "Today":
                const Today = new Date();
                durationDate = formatDate(Today);
                break;
            case "EndOfLastMonth":
                const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
                durationDate = formatDate(lastMonthEnd);
                break;
            case "EndOfThisMonth":
                const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                durationDate = formatDate(currentMonthEnd);
                break;
            case "EndOfLastQuarter":
                const firstQuarterDate = new Date(currentDate.getFullYear(), Math.floor((currentDate.getMonth() / 3)) * 3 - 3, 1)
                const lastQuarterEnd = new Date(firstQuarterDate.getFullYear(), firstQuarterDate.getMonth() + 3, 0);
                durationDate = formatDate(lastQuarterEnd);
                break;
            case "EndOfLastFinancialYear":
                const lastFinancialYearEnd = new Date(currentDate.getFullYear() - 1, 3, 0);
                durationDate = formatDate(lastFinancialYearEnd);
                break;
            default:
                console.log("Invalid Duration");
                return res.status(200).json(genericResponse(false, "Duration Value is invalid", []));
        };

        function getLastMonthDate(startDate, monthsAgo) {
            var endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() - monthsAgo);
            return endDate;
        }

        var last1MonthDate = formatDate(getLastMonthDate(durationDate, 1));

        var last2MonthsDate = formatDate(getLastMonthDate(durationDate, 2));

        var last3MonthsDate = formatDate(getLastMonthDate(durationDate, 3));

        var last4MonthsDate = formatDate(getLastMonthDate(durationDate, 4));

        let onDate = "$invoiceDate"
        if (post.agingBy === "dueDate") {
            onDate = "$dueDate"
        }
        const fetchList = [
            {
                $match: {
                    $and: [
                        {
                            businessUserID: mongoose.Types.ObjectId(post.businessUserID), invoiceStatus: { $ne: "Paid" }
                        },
                        {
                            $expr: { $lte: [{ $dateToString: { "format": "%Y-%m-%d", "date": onDate } }, durationDate] }
                        }
                    ]
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
            { $unwind: '$contact' },
            {
                $lookup: {
                    from: 'invoice_retention_payments',
                    localField: "_id",
                    foreignField: "invoiceID",
                    as: "irp"
                }
            },
            {
                "$unwind": {
                    "path": "$irp",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $addFields: {
                    duration: { $toDate: durationDate },
                    onDate: { $toDate: onDate },
                    ltOneMonthDate: { $toDate: last1MonthDate },
                    ltTwoMonthDate: { $toDate: last2MonthsDate },
                    ltThreeMonthDate: { $toDate: last3MonthsDate },
                    ltFourMonthDate: { $toDate: last4MonthsDate },
                }
            },
            {
                $group: {
                    _id: "$contact._id",
                    contactName: { "$first": "$contact.name" },
                    lessThanOneMonthTotalAmount: {
                        $sum: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $gte: ["$duration", "$onDate"] },
                                        { $gt: ["$onDate", "$ltOneMonthDate"] }
                                    ]
                                },
                                then: {
                                    $cond: {
                                        if: { $eq: ["$scheduleRetention", false] },
                                        then: "$payablePendingAmount",
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$irp.retentionStatus", "Unpaid"] },
                                                then: "$irp.retentionPaymentAmount",
                                                else: 0
                                            }
                                        }
                                    }
                                },
                                else: 0
                            }
                        }
                    },
                    moreThanOneMonthTotalAmount: {
                        $sum: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $gte: ["$ltOneMonthDate", "$onDate"] },
                                        { $gt: ["$onDate", "$ltTwoMonthDate"] }
                                    ]
                                },
                                then: {
                                    $cond: {
                                        if: { $eq: ["$scheduleRetention", false] },
                                        then: "$payablePendingAmount",
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$irp.retentionStatus", "Unpaid"] },
                                                then: "$irp.retentionPaymentAmount",
                                                else: 0
                                            }
                                        }
                                    }
                                },
                                else: 0

                            }
                        }
                    },
                    moreThanTwoMonthTotalAmount: {
                        $sum: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $gte: ["$ltTwoMonthDate", "$onDate"] },
                                        { $gt: ["$onDate", "$ltThreeMonthDate"] }
                                    ]
                                },
                                then: {
                                    $cond: {
                                        if: { $eq: ["$scheduleRetention", false] },
                                        then: "$payablePendingAmount",
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$irp.retentionStatus", "Unpaid"] },
                                                then: "$irp.retentionPaymentAmount",
                                                else: 0
                                            }
                                        }
                                    }
                                },
                                else: 0

                            }
                        }
                    },
                    moreThanThreeMonthTotalAmount: {
                        $sum: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $gte: ["$ltThreeMonthDate", "$onDate"] },
                                        { $gt: ["$onDate", "$ltFourMonthDate"] }
                                    ]
                                },
                                then: {
                                    $cond: {
                                        if: { $eq: ["$scheduleRetention", false] },
                                        then: "$payablePendingAmount",
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$irp.retentionStatus", "Unpaid"] },
                                                then: "$irp.retentionPaymentAmount",
                                                else: 0
                                            }
                                        }
                                    }
                                },
                                else: 0
                            }
                        }
                    },
                    olderThanThreeMonthTotalAmount: {
                        $sum: {
                            $cond: {
                                if: { $gte: ["$ltFourMonthDate", "$onDate"] },
                                then: {
                                    $cond: {
                                        if: { $eq: ["$scheduleRetention", false] },
                                        then: "$payablePendingAmount",
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$irp.retentionStatus", "Unpaid"] },
                                                then: "$irp.retentionPaymentAmount",
                                                else: 0
                                            }
                                        }
                                    }
                                },
                                else: 0
                            }
                        }
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    contactName: "$contactName",
                    totalAmount: {
                        $sum: [
                            "$lessThanOneMonthTotalAmount",
                            "$moreThanOneMonthTotalAmount",
                            "$moreThanTwoMonthTotalAmount",
                            "$moreThanThreeMonthTotalAmount",
                            "$olderThanThreeMonthTotalAmount",
                        ]
                    },
                    lessThanOneMonthTotalAmountToString: { $toString: "$lessThanOneMonthTotalAmount" },
                    lessThanOneMonthTotalAmount: "$lessThanOneMonthTotalAmount",
                    moreThanOneMonthTotalAmountToString: { $toString: "$moreThanOneMonthTotalAmount" },
                    moreThanOneMonthTotalAmount: "$moreThanOneMonthTotalAmount",
                    moreThanTwoMonthTotalAmountToString: { $toString: "$moreThanTwoMonthTotalAmount" },
                    moreThanTwoMonthTotalAmount: "$moreThanTwoMonthTotalAmount",
                    moreThanThreeMonthTotalAmountToString: { $toString: "$moreThanThreeMonthTotalAmount" },
                    moreThanThreeMonthTotalAmount: "$moreThanThreeMonthTotalAmount",
                    olderThanThreeMonthTotalAmountToString: { $toString: "$olderThanThreeMonthTotalAmount" },
                    olderThanThreeMonthTotalAmount: "$olderThanThreeMonthTotalAmount",

                },
            },
            { $match: searchQuery }
        ]

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
            fetchList.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        console.log("fetch", fetchList)
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        let myItemAggregation = Invoices.aggregate(fetchList);
        Invoices.aggregatePaginate(
            myItemAggregation, options,

            (err, result) => {
                if (err) {
                    console.log("fetchAgedReceivables err: ", err);
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    return res.status(400).json(errorResponse);
                } else {
                    console.log("fetchAgedReceivables result: ", result);
                    let GrandTotal = {
                        contactName: "Total",
                        totalAmount: 0,
                        lessThanOneMonthTotalAmount: 0,
                        moreThanOneMonthTotalAmount: 0,
                        moreThanTwoMonthTotalAmount: 0,
                        moreThanThreeMonthTotalAmount: 0,
                        olderThanThreeMonthTotalAmount: 0,
                    }
                    result.docs.forEach((rows) => {
                        GrandTotal.totalAmount += rows.totalAmount;
                        GrandTotal.lessThanOneMonthTotalAmount += rows.lessThanOneMonthTotalAmount;
                        GrandTotal.moreThanOneMonthTotalAmount += rows.moreThanOneMonthTotalAmount;
                        GrandTotal.moreThanTwoMonthTotalAmount += rows.moreThanTwoMonthTotalAmount;
                        GrandTotal.moreThanThreeMonthTotalAmount += rows.moreThanThreeMonthTotalAmount;
                        GrandTotal.olderThanThreeMonthTotalAmount += rows.olderThanThreeMonthTotalAmount;
                    });
                    result.docs.push(GrandTotal)
                    const successResponse = genericResponse(true, "fetchAgedReceivables fetched successfully.", { result });
                    return res.status(200).json(successResponse);
                }
            }
        )
    } catch (error) {
        console.log("error in fetchAgedReceivables: ", error);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

export default fetchAgedReceivables;


