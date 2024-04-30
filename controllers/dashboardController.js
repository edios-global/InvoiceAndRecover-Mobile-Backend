import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose';
import genericResponse from '../routes/genericWebResponses.js';
import BusinessUsers from '../models/businessUsersModel.js';
import SubscriptionTransactionsModel from '../models/subscriptionTransactionsModel.js';
import Customer from '../models/customerBfmModel.js';
import Orders from '../models/ordersModel.js';
import InvoicePaymentsModel from '../models/invoicePaymentsModel.js';
import BussinessUserCredit from '../models/businessuserCreditsModel.js';
import OrderDriverJob from '../models/orderDriverJobsModel.js';
import SubscriptionPlan from '../models/subscriptionPlansModel.js';


function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months[date.getMonth()];
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = (hour % 12 === 0 ? 12 : hour % 12).toString();
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${day} ${month} ${formattedHour}:${formattedMinute} ${ampm}`;
}
// Super Admin 
const fetchSuperAdminDashboardData = asyncHandler(async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.getUTCHours(0, 0, 0, 0);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const result = await BusinessUsers.aggregate([
            {
                $facet: {
                    activePaidUserCount: [
                        {
                            $match: { trialUser: 0, businessUserStatus: 'Active' }
                        },
                        {
                            $lookup: {
                                from: 'subscription_transactions',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            transactionStatus: 'Processed'
                                        }
                                    }
                                ],
                                as: 'subscriptionTransaction'
                            }
                        },
                        {
                            $unwind: "$subscriptionTransaction"
                        },
                        {
                            $group: {
                                _id: "$subscriptionTransaction.businessUserID",
                                activeUserCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    activePaidUserCountLastMonth: [
                        {
                            $match: { trialUser: 0, businessUserStatus: 'Active' }
                        },
                        {
                            $lookup: {
                                from: 'subscription_transactions',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            transactionStatus: 'Processed',
                                            createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'subscriptionTransaction'
                            }
                        },
                        {
                            $unwind: "$subscriptionTransaction"
                        },
                        {
                            $group: {
                                _id: "$subscriptionTransaction.businessUserID",
                                activeUserCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    activeTrialUserCount: [
                        {
                            $match: { trialUser: 1, businessUserStatus: 'Active' }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    activeTrialUserCountLastMonth: [
                        {
                            $match: { trialUser: 1, businessUserStatus: 'Active', createdDate: { $gte: oneMonthAgo } }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    activeBusinessUserCustomerCount: [
                        {
                            $match: { businessUserStatus: 'Active' }
                        },
                        {
                            $lookup: {
                                from: 'customers',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            customerStatus: 'Active'
                                        }
                                    }
                                ],
                                as: 'customers'
                            }
                        },
                        {
                            $unwind: "$customers"
                        },
                        {
                            $group: {
                                _id: "$customers._id",
                                activeUserCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    activeBusinessUserCustomerCountLastMonth: [
                        {
                            $match: { businessUserStatus: 'Active' }
                        },
                        {
                            $lookup: {
                                from: 'customers',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            customerStatus: 'Active',
                                            createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'customers'
                            }
                        },
                        {
                            $unwind: "$customers"
                        },
                        {
                            $group: {
                                _id: "$customers._id",
                                activeUserCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalRevenueAmount: [
                        {
                            $match: { businessUserStatus: 'Active' }
                        },
                        {
                            $lookup: {
                                from: 'invoice_payments',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            invoiceStatus: "Paid"
                                        }
                                    }
                                ],
                                as: 'invoicePayments'
                            }
                        },
                        {
                            $unwind: "$invoicePayments"
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenueAmount: { "$sum": "$invoicePayments.invoiceAmount" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalRevenueAmount: 1
                            }
                        }
                    ],
                    totalRevenueAmountLastMonth: [
                        {
                            $match: { businessUserStatus: 'Active' }
                        },
                        {
                            $lookup: {
                                from: 'invoice_payments',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            invoiceStatus: "Paid", createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'invoicePayments'
                            }
                        },
                        {
                            $unwind: "$invoicePayments"
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenueAmount: { "$sum": "$invoicePayments.invoiceAmount" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalRevenueAmount: 1
                            }
                        }
                    ],
                }
            }
        ]);
        if (result) {
            let activePaidUserCount = 0;
            let activePaidUserCountLastMonth = 0;
            let paidUserPercentage = 0;
            let activeTrialUserCount = 0;
            let activeTrialUserCountLastMonth = 0;
            let trialUserPercentage = 0;
            let activeBusinessUserCustomerCount = 0;
            let activeBusinessUserCustomerCountLastMonth = 0;
            let trialBusinessUserCustomerPercentage = 0;
            let totalRevenueAmount = 0;
            let totalRevenueAmountLastMonth = 0;
            let totalRevenueAmountPercentage = 0;


            if (result[0].activePaidUserCount.length > 0) {
                activePaidUserCount = result[0].activePaidUserCount[0].totalCount;
                if (result[0].activePaidUserCountLastMonth.length > 0) {
                    activePaidUserCountLastMonth = result[0].activePaidUserCountLastMonth[0].totalCount;
                    paidUserPercentage = (activePaidUserCountLastMonth / (activePaidUserCount - activePaidUserCountLastMonth)) * 100;
                }
            }
            if (result[0].activeTrialUserCount.length > 0) {
                activeTrialUserCount = result[0].activeTrialUserCount[0].totalCount;
                if (result[0].activeTrialUserCountLastMonth.length > 0) {
                    activeTrialUserCountLastMonth = result[0].activeTrialUserCountLastMonth[0].totalCount;
                    trialUserPercentage = (activeTrialUserCountLastMonth / (activeTrialUserCount - activeTrialUserCountLastMonth)) * 100;
                }
            }
            if (result[0].activeBusinessUserCustomerCount.length > 0) {
                activeBusinessUserCustomerCount = result[0].activeBusinessUserCustomerCount[0].totalCount;
                if (result[0].activeBusinessUserCustomerCountLastMonth.length > 0) {
                    activeBusinessUserCustomerCountLastMonth = result[0].activeBusinessUserCustomerCountLastMonth[0].totalCount;
                    trialBusinessUserCustomerPercentage = (activeBusinessUserCustomerCountLastMonth / (activeBusinessUserCustomerCount - activeBusinessUserCustomerCountLastMonth)) * 100;
                }
            }
            if (result[0].totalRevenueAmount.length > 0) {
                totalRevenueAmount = result[0].totalRevenueAmount[0].totalRevenueAmount;
                if (result[0].totalRevenueAmountLastMonth.length > 0) {
                    totalRevenueAmountLastMonth = result[0].totalRevenueAmountLastMonth[0].totalRevenueAmount;
                    totalRevenueAmountPercentage = (totalRevenueAmountLastMonth / (totalRevenueAmount = totalRevenueAmountLastMonth)) * 100;
                }
            }
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully',
                output: {
                    ActivePaidUserCount: activePaidUserCount,
                    PaidUserPercentage: paidUserPercentage,
                    ActiveTrialUserCount: activeTrialUserCount,
                    TrialUserPercentage: trialUserPercentage,
                    ActiveBusinessUserCustomerCount: activeBusinessUserCustomerCount,
                    TrialBusinessUserCustomerPercentage: trialBusinessUserCustomerPercentage,
                    TotalRevenueAmount: totalRevenueAmount,
                    TotalRevenueAmountPercentage: totalRevenueAmountPercentage,

                },
            });
        }
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchSuperAdminDasboardBarChartData = asyncHandler(async (req, res) => {
    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setDate(today.getDate() + 1);
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const result = await BusinessUsers.aggregate([
            {
                $match: {
                    businessUserStatus: "Active",
                    createdDate: { $gte: sixMonthsAgo, $lt: today }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdDate" },
                        month: { $month: "$createdDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const countsByMonth = {};
        result.forEach(item => {
            const { year, month } = item._id;
            countsByMonth[`${year}-${month}`] = item.count;
        });
        const sixMonthsAgoYear = sixMonthsAgo.getUTCFullYear();
        const sixMonthsAgoMonth = sixMonthsAgo.getUTCMonth() + 1;
        for (let i = 0; i < 6; i++) {
            const year = sixMonthsAgoYear;
            const month = sixMonthsAgoMonth + i;
            const key = `${year}-${month}`;
            if (!(key in countsByMonth)) {
                countsByMonth[key] = 0;
            }
        }
        const output = Object.entries(countsByMonth).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
                _id: { year: parseInt(year), month: parseInt(month) },
                count
            };
        });
        output.sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: output
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchSuperAdminDasboardLineChartData = asyncHandler(async (req, res) => {
    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setDate(today.getDate() + 1);
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const result = await BusinessUsers.aggregate([
            {
                $match: {
                    businessUserStatus: "Active",
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: 'businessUserID',
                    pipeline: [
                        {
                            $match: {
                                customerStatus: 'Active',
                                createdDate: { $gte: sixMonthsAgo, $lt: today }
                            }
                        }
                    ],
                    as: 'customers'
                }
            },
            { $unwind: "$customers" },
            {
                $group: {
                    _id: {
                        year: { $year: "$customers.createdDate" },
                        month: { $month: "$customers.createdDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const countsByMonth = {};
        result.forEach(item => {
            const { year, month } = item._id;
            countsByMonth[`${year}-${month}`] = item.count;
        });
        const sixMonthsAgoYear = sixMonthsAgo.getUTCFullYear();
        const sixMonthsAgoMonth = sixMonthsAgo.getUTCMonth() + 1;
        for (let i = 0; i < 6; i++) {
            const year = sixMonthsAgoYear;
            const month = sixMonthsAgoMonth + i;
            const key = `${year}-${month}`;
            if (!(key in countsByMonth)) {
                countsByMonth[key] = 0;
            }
        }
        const output = Object.entries(countsByMonth).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
                _id: { year: parseInt(year), month: parseInt(month) },
                count
            };
        });
        output.sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: output
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchSuperAdminDasboardLineChartDataRevenue = asyncHandler(async (req, res) => {
    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setDate(today.getDate() + 1);
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const result = await InvoicePaymentsModel.aggregate([
            {
                $match: {
                    invoiceStatus: "Paid"
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdDate" },
                        month: { $month: "$createdDate" }
                    },
                    count: { $sum: "$invoiceAmount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const countsByMonth = {};
        result.forEach(item => {
            const { year, month } = item._id;
            countsByMonth[`${year}-${month}`] = item.count;
        });
        const sixMonthsAgoYear = sixMonthsAgo.getUTCFullYear();
        const sixMonthsAgoMonth = sixMonthsAgo.getUTCMonth() + 1;
        for (let i = 0; i < 6; i++) {
            const year = sixMonthsAgoYear;
            const month = sixMonthsAgoMonth + i;
            const key = `${year}-${month}`;
            if (!(key in countsByMonth)) {
                countsByMonth[key] = 0;
            }
        }
        const output = Object.entries(countsByMonth).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
                _id: { year: parseInt(year), month: parseInt(month) },
                count
            };
        });
        output.sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: output
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchSuperAdminDasboardActivityData = asyncHandler(async (req, res) => {
    try {

        const fetchFreePlan = await SubscriptionPlan.find({ planCode: 'BosFM_FreeTrial' })
        const [trialUser, boughtSubscription, lastAdditionalCredits, highestCreditUsage, lowestCreditUsage, cancellationRequest] = await Promise.all([
            BusinessUsers.aggregate([
                {
                    $match: {
                        businessUserStatus: "Active",
                        trialUser: 1, newBusinessUserPlanID: { $nin: [mongoose.Types.ObjectId(fetchFreePlan[0]._id)] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        createdDate: 1
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $limit: 1
                }
            ]),
            SubscriptionTransactionsModel.aggregate([
                {
                    $match: {
                        transactionStatus: "Processed"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        createdDate: 1
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $limit: 1
                }
            ]),
            InvoicePaymentsModel.aggregate([
                {
                    $match: {
                        transactionType: "Add Credit",
                        invoiceStatus: "Paid"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        createdDate: 1
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $limit: 1
                }
            ]),
            BussinessUserCredit.aggregate([
                {
                    $lookup: {
                        from: 'business_users',
                        localField: 'businessUserID',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    businessUserStatus: "Active",
                                }
                            },
                        ],
                        as: 'businessUsers'
                    }
                },
                {
                    $unwind: "$businessUsers",
                },
                {
                    $group: {
                        _id: "$businessUsers._id",
                        userName: { $first: { $concat: ["$businessUsers.firstName", " ", "$businessUsers.lastName"] } },
                        totalCreditsUsed: { $sum: "$creditsUsed" }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalCreditsUsed: 1,
                        userName: 1
                    }
                },
                {
                    $sort: {
                        totalCreditsUsed: -1
                    }
                },
                {
                    $limit: 1
                }
            ]),
            BussinessUserCredit.aggregate([
                {
                    $lookup: {
                        from: 'business_users',
                        localField: 'businessUserID',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    businessUserStatus: "Active",
                                }
                            },
                        ],
                        as: 'businessUsers'
                    }
                },
                {
                    $unwind: "$businessUsers",
                },
                {
                    $group: {
                        _id: "$businessUsers._id",
                        userName: { $first: { $concat: ["$businessUsers.firstName", " ", "$businessUsers.lastName"] } },
                        totalCreditsUsed: { $sum: "$creditsUsed" }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalCreditsUsed: 1,
                        userName: 1
                    }
                },
                {
                    $sort: {
                        totalCreditsUsed: 1
                    }
                },
                {
                    $limit: 1
                }
            ]),


            BusinessUsers.find({ planCancellationReqeustDate: { $exists: true } }).sort({ planCancellationReqeustDate: -1 }).limit(1),
        ]);
        const formattedTrialUserDate = trialUser.map((item) => {
            return { trialUserDate: formatDate(item.createdDate) };
        });
        const formattedBoughtSubscriptionDate = boughtSubscription.map((item) => {
            return { boughtSubscriptionDate: formatDate(item.createdDate) };
        });
        const formattedAdditionalCreditsDate = lastAdditionalCredits.map((item) => {
            return { lastAdditionalCreditDate: formatDate(item.createdDate) };
        });
        const cancellationFormatedDate = cancellationRequest.map((item) => {
            return { cancellationDate: formatDate(item.planCancellationReqeustDate) };
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: { formattedTrialUserDate, formattedBoughtSubscriptionDate, formattedAdditionalCreditsDate, highestCreditUsage, lowestCreditUsage, cancellationFormatedDate },
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchDasboardSuperAdminGridData = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.getUTCHours(0, 0, 0, 0);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        if (post.mostActive === false) {
            const result = await BusinessUsers.aggregate([
                {
                    $match: {
                        businessUserStatus: "Active"
                    }
                },
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id',
                        foreignField: 'businessUserID',
                        pipeline: [
                            {
                                $match: {
                                    customerStatus: 'Active',
                                    createdDate: { $gte: oneMonthAgo }
                                }
                            }
                        ],
                        as: 'customers'
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'businessUserID',
                        pipeline: [
                            {
                                $match: {
                                    createdDate: { $gte: oneMonthAgo }
                                }
                            }
                        ],
                        as: 'orders'
                    }
                },
                {
                    $addFields: {
                        customerCount: { $size: '$customers' },
                        totalOrderCount: { $size: '$orders' },
                        completedOrderCount: {
                            $size: {
                                $filter: {
                                    input: '$orders',
                                    as: 'order',
                                    cond: { $eq: ['$$order.orderStatus', 'Completed'] }
                                }
                            }
                        },
                    }
                },
                {
                    $addFields: {
                        completedOrderPercentage: {
                            $cond: {
                                if: { $eq: ['$totalOrderCount', 0] },
                                then: 0,
                                else: {
                                    $trunc: { $multiply: [{ $divide: ['$completedOrderCount', '$totalOrderCount'] }, 100] }
                                }
                            }
                        },
                        latestOrderDateTime: {
                            $max: "$orders.createdDate"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                        customerCount: 1,
                        totalOrderCount: 1,
                        completedOrderPercentage: 1,
                        latestOrderDateTimeFormatted: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: "$latestOrderDateTime"
                            }
                        }
                    }
                },
                {
                    $sort: { latestOrderDateTimeFormatted: -1 }
                },
                {
                    $limit: 10
                }
            ]);
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully',
                output: result,
            });
        }
        else {
            const result = await BusinessUsers.aggregate([
                {
                    $match: {
                        businessUserStatus: "Active"
                    }
                },
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id',
                        foreignField: 'businessUserID',
                        pipeline: [
                            {
                                $match: {
                                    customerStatus: 'Active',
                                }
                            }
                        ],
                        as: 'customers'
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'businessUserID',
                        pipeline: [
                            {
                                $match: {
                                    createdDate: { $gte: oneMonthAgo }
                                }
                            }
                        ],
                        as: 'orders'
                    }
                },
                {
                    $addFields: {
                        customerCount: { $size: '$customers' },
                        totalOrderCount: { $size: '$orders' },
                        completedOrderCount: {
                            $size: {
                                $filter: {
                                    input: '$orders',
                                    as: 'order',
                                    cond: { $eq: ['$$order.orderStatus', 'Completed'] }
                                }
                            }
                        },
                    }
                },
                {
                    $addFields: {
                        completedOrderPercentage: {
                            $cond: {
                                if: { $eq: ['$totalOrderCount', 0] },
                                then: 0,
                                else: {
                                    $trunc: { $multiply: [{ $divide: ['$completedOrderCount', '$totalOrderCount'] }, 100] }
                                }
                            }
                        },
                        latestOrderDateTime: {
                            $max: "$orders.createdDate"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                        customerCount: 1,
                        totalOrderCount: 1,
                        completedOrderPercentage: 1,
                        latestOrderDateTimeFormatted: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: "$latestOrderDateTime"
                            }
                        }
                    }
                },
                {
                    $sort: { totalOrderCount: -1 }
                },
                {
                    $limit: 10
                }
            ]);
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully',
                output: result,
            });
        }
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});


// Business User 

const fetchBusinessUserDashboardData = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.getUTCHours(0, 0, 0, 0);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const result = await BusinessUsers.aggregate([
            {
                $facet: {
                    totalActiveCustomerCount: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'customers',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            customerStatus: 'Active'
                                        }
                                    }
                                ],
                                as: 'customers'
                            }
                        },
                        {
                            $unwind: "$customers"
                        },
                        {
                            $group: {
                                _id: "$customers._id",
                                activeUserCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalActiveCustomerCountLastMonth: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'customers',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            customerStatus: 'Active',
                                            createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'customers'
                            }
                        },
                        {
                            $unwind: "$customers"
                        },
                        {
                            $group: {
                                _id: "$customers._id",
                                activeUserCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalOrderCount: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            orderStatus: 'Completed'
                                        }
                                    }
                                ],
                                as: 'orders'
                            }
                        },
                        {
                            $unwind: "$orders"
                        },
                        {
                            $group: {
                                _id: "$orders._id",
                                orderCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalOrderCountLastMonth: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            orderStatus: 'Completed',
                                            createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'orders'
                            }
                        },
                        {
                            $unwind: "$orders"
                        },
                        {
                            $group: {
                                _id: "$orders._id",
                                orderCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalInprogressOrderCount: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            orderStatus: { $nin: ['Completed', 'Cancelled', 'New', 'Draft'] }, paymentStatus: "Successful"
                                        }
                                    }
                                ],
                                as: 'orders'
                            }
                        },
                        {
                            $unwind: "$orders"
                        },
                        {
                            $group: {
                                _id: "$orders._id",
                                orderCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalInprogressOrderCountLastMonth: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            orderStatus: { $nin: ['Completed', 'Cancelled', 'New', 'Draft'] },
                                            createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'orders'
                            }
                        },
                        {
                            $unwind: "$orders"
                        },
                        {
                            $group: {
                                _id: "$orders._id",
                                orderCount: { "$sum": 1 }
                            }
                        },
                        {
                            $count: "totalCount"
                        }
                    ],
                    totalOrderRevenueAmount: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                as: 'orders'
                            }
                        },
                        {
                            $unwind: "$orders"
                        },
                        {
                            $group: {
                                _id: null,
                                totalOrderRevenueAmount: { "$sum": "$orders.totalCharges" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalOrderRevenueAmount: 1
                            }
                        }
                    ],
                    totalOrderRevenueAmountLastMonth: [
                        {
                            $match: { businessUserStatus: 'Active', _id: mongoose.Types.ObjectId(post.businessUserID) }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'businessUserID',
                                pipeline: [
                                    {
                                        $match: {
                                            createdDate: { $gte: oneMonthAgo }
                                        }
                                    }
                                ],
                                as: 'orders'
                            }
                        },
                        {
                            $unwind: "$orders"
                        },
                        {
                            $group: {
                                _id: null,
                                totalOrderRevenueAmount: { "$sum": "$orders.totalCharges" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalOrderRevenueAmount: 1
                            }
                        }
                    ],
                }
            }
        ]);
        if (result) {
            let totalActiveCustomerCount = 0;
            let totalActiveCustomerCountLastMonth = 0;
            let lastMonthActiveCustomerPercentage = 0;
            let totalOrderCount = 0;
            let totalOrderCountLastMonth = 0;
            let lastMonthOrderPercentage = 0;
            let totalInprogressOrderCount = 0;
            let totalInprogressOrderCountLastMonth = 0;
            let lastMonthInprogressOrderPercentage = 0;
            let totalOrderRevenueAmount = 0;
            let totalOrderRevenueAmountLastMonth = 0;
            let lastMonthOrderRevenuePercentage = 0;

            if (result[0].totalActiveCustomerCount.length > 0) {
                totalActiveCustomerCount = result[0].totalActiveCustomerCount[0].totalCount;
                if (result[0].totalActiveCustomerCountLastMonth.length > 0) {
                    totalActiveCustomerCountLastMonth = result[0].totalActiveCustomerCountLastMonth[0].totalCount;
                    lastMonthActiveCustomerPercentage = (totalActiveCustomerCountLastMonth / (totalActiveCustomerCount - totalActiveCustomerCountLastMonth)) * 100;
                }
            }
            if (result[0].totalOrderCount.length > 0) {
                totalOrderCount = result[0].totalOrderCount[0].totalCount;
                if (result[0].totalOrderCountLastMonth.length > 0) {
                    totalOrderCountLastMonth = result[0].totalOrderCountLastMonth[0].totalCount;
                    lastMonthOrderPercentage = (totalOrderCountLastMonth / (totalOrderCount - lastMonthOrderPercentage)) * 100;
                }
            }
            if (result[0].totalInprogressOrderCount.length > 0) {
                totalInprogressOrderCount = result[0].totalInprogressOrderCount[0].totalCount;
                if (result[0].totalInprogressOrderCountLastMonth.length > 0) {
                    totalInprogressOrderCountLastMonth = result[0].totalInprogressOrderCountLastMonth[0].totalCount;
                    lastMonthInprogressOrderPercentage = (totalInprogressOrderCountLastMonth / (totalInprogressOrderCount - totalInprogressOrderCountLastMonth)) * 100;
                }
            }
            if (result[0].totalOrderRevenueAmount.length > 0) {
                totalOrderRevenueAmount = result[0].totalOrderRevenueAmount[0].totalOrderRevenueAmount;
                if (result[0].totalOrderRevenueAmountLastMonth.length > 0) {
                    totalOrderRevenueAmountLastMonth = result[0].totalOrderRevenueAmountLastMonth[0].totalOrderRevenueAmount;
                    lastMonthOrderRevenuePercentage = (totalOrderRevenueAmountLastMonth / (totalOrderRevenueAmount - totalOrderRevenueAmountLastMonth)) * 100;
                }
            }
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully',
                output: {
                    TotalActiveCustomerCount: totalActiveCustomerCount,
                    LastMonthActiveCustomerPercentage: lastMonthActiveCustomerPercentage,
                    TotalOrderCount: totalOrderCount,
                    LastMonthOrderPercentage: lastMonthOrderPercentage,
                    TotalInprogressOrderCount: totalInprogressOrderCount,
                    LastMonthInprogressOrderPercentage: lastMonthInprogressOrderPercentage,
                    TotalOrderRevenueAmount: totalOrderRevenueAmount,
                    LastMonthOrderRevenuePercentage: lastMonthOrderRevenuePercentage,
                },
            });
        }
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchBusinessUserDasboardBarChartData = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setDate(today.getDate() + 1);
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const result = await Customer.aggregate([
            {
                $match: {
                    customerStatus: "Active",
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID), createdDate: { $gte: sixMonthsAgo, $lt: today }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdDate" },
                        month: { $month: "$createdDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const countsByMonth = {};
        result.forEach(item => {
            const { year, month } = item._id;
            countsByMonth[`${year}-${month}`] = item.count;
        });
        const sixMonthsAgoYear = sixMonthsAgo.getUTCFullYear();
        const sixMonthsAgoMonth = sixMonthsAgo.getUTCMonth() + 1;
        for (let i = 0; i < 6; i++) {
            const year = sixMonthsAgoYear;
            const month = sixMonthsAgoMonth + i;
            const key = `${year}-${month}`;
            if (!(key in countsByMonth)) {
                countsByMonth[key] = 0;
            }
        }
        const output = Object.entries(countsByMonth).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
                _id: { year: parseInt(year), month: parseInt(month) },
                count
            };
        });
        output.sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: output
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchBusinessUserDasboardLineChartData = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setDate(today.getDate() + 1);
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const result = await Orders.aggregate([
            {
                $match: {
                    orderStatus: "Completed", businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdDate" },
                        month: { $month: "$createdDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const countsByMonth = {};
        result.forEach(item => {
            const { year, month } = item._id;
            countsByMonth[`${year}-${month}`] = item.count;
        });
        const sixMonthsAgoYear = sixMonthsAgo.getUTCFullYear();
        const sixMonthsAgoMonth = sixMonthsAgo.getUTCMonth() + 1;
        for (let i = 0; i < 6; i++) {
            const year = sixMonthsAgoYear;
            const month = sixMonthsAgoMonth + i;
            const key = `${year}-${month}`;
            if (!(key in countsByMonth)) {
                countsByMonth[key] = 0;
            }
        }
        const output = Object.entries(countsByMonth).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
                _id: { year: parseInt(year), month: parseInt(month) },
                count
            };
        });
        output.sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: output
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchBusinessUserDasboardLineChartDataOrderRevenue = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setDate(today.getDate() + 1);
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const result = await Orders.aggregate([
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdDate" },
                        month: { $month: "$createdDate" }
                    },
                    count: { $sum: "$totalCharges" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const countsByMonth = {};
        result.forEach(item => {
            const { year, month } = item._id;
            countsByMonth[`${year}-${month}`] = item.count;
        });
        const sixMonthsAgoYear = sixMonthsAgo.getUTCFullYear();
        const sixMonthsAgoMonth = sixMonthsAgo.getUTCMonth() + 1;
        for (let i = 0; i < 6; i++) {
            const year = sixMonthsAgoYear;
            const month = sixMonthsAgoMonth + i;
            const key = `${year}-${month}`;
            if (!(key in countsByMonth)) {
                countsByMonth[key] = 0;
            }
        }
        const output = Object.entries(countsByMonth).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
                _id: { year: parseInt(year), month: parseInt(month) },
                count
            };
        });
        output.sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: output
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchBusinessUserDasboardActivityData = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const [readyForPickup, localWarehouse, warehouseToWarehouse, finalDelivery, dropAtWarehouse] = await Promise.all([
            OrderDriverJob.aggregate([
                {
                    $match: {
                        jobStatus: "Job Started", businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCount: 1
                    }
                }
            ]),
            OrderDriverJob.aggregate([
                {
                    $match: {
                        jobStatus: "Job Picked", orderID: { $exists: true }, businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCount: 1
                    }
                }
            ]),
            OrderDriverJob.aggregate([
                {
                    $match: {
                        jobStatus: {
                            $in: [
                                "Job Started",
                                "Job Accepted",
                                "Job Picked",
                            ]
                        }, orderID: { $exists: false }, businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'jobID',
                        as: 'orders'
                    }
                },

                {
                    $group: {
                        _id: null,
                        totalCount: {
                            $sum: {
                                $cond: {
                                    if: { $eq: [{ $size: "$orders" }, 0] }, // Check if 'orders' array is empty
                                    then: 1, // If empty, add 1 to the sum
                                    else: 0 // If not empty, add 0 to the sum
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCount: 1
                    }
                }
            ]),
            Orders.aggregate([
                {
                    $match: {
                        jobID: { $exists: true }, businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                    }
                },
                {
                    $lookup: {
                        from: 'order_driver_jobs',
                        localField: 'jobID',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    jobStatus: {
                                        $in: [
                                            "Job Started",
                                            "Job Accepted",
                                            "Job Picked",
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'orderDriverJob'
                    }
                },
                {
                    $unwind: "$orderDriverJob"
                },
                {
                    $group: {
                        _id: "$orderDriverJob._id",
                        totalCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCount: 1
                    }
                }
            ]),
            Orders.find({ shipmentType: "drop at Warehouse", businessUserID: mongoose.Types.ObjectId(post.businessUserID) }).count(),


        ]);
        res.status(200).json({
            success: true,
            message: 'Data fetched successfully',
            output: { readyForPickup, localWarehouse, warehouseToWarehouse, finalDelivery, dropAtWarehouse },
        });
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});

const fetchDasboardBusinessUserGridData = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.getUTCHours(0, 0, 0, 0);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        if (post.mostActive === false) {
            const result = await Customer.aggregate([
                {
                    $match: {
                        customerStatus: "Active", businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'customerID',
                        as: 'orders'
                    }
                },
                {
                    $unwind: "$orders",
                },
                {
                    $group: {
                        _id: "$_id",
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: "$orders.totalCharges" },
                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$orders.orderStatus", "Completed"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        firstName: { $first: "$firstName" },
                        lastName: { $first: "$lastName" },
                        latestOrderDateTime: {
                            $max: "$orders.createdDate"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalAmount: 1,
                        completedOrders: 1,
                        fullName: { $concat: ["$firstName", " ", "$lastName"] },
                        completedOrdersPercentage: {
                            $trunc: {
                                $multiply: [{ $divide: ["$completedOrders", "$totalOrders"] }, 100]
                            }
                        },
                        latestOrderDateTimeFormatted: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S", // Customize the format as needed
                                date: "$latestOrderDateTime"
                            }
                        }
                    }
                },
                {
                    $sort: { latestOrderDateTimeFormatted: -1 }
                },
                {
                    $limit: 10
                }
            ]);
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully',
                output: result,
            });
        }
        else {
            const result = await Customer.aggregate([
                {
                    $match: {
                        customerStatus: "Active", businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'customerID',
                        as: 'orders'
                    }
                },
                {
                    $unwind: "$orders",
                },
                {
                    $group: {
                        _id: "$_id",
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: "$orders.totalCharges" },
                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$orders.orderStatus", "Completed"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        firstName: { $first: "$firstName" },
                        lastName: { $first: "$lastName" },
                        latestOrderDateTime: {
                            $max: "$orders.createdDate"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalAmount: 1,
                        completedOrders: 1,
                        fullName: { $concat: ["$firstName", " ", "$lastName"] },
                        completedOrdersPercentage: {
                            $trunc: {
                                $multiply: [{ $divide: ["$completedOrders", "$totalOrders"] }, 100]
                            }
                        },
                        latestOrderDateTimeFormatted: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S", // Customize the format as needed
                                date: "$latestOrderDateTime"
                            }
                        }
                    }
                },
                {
                    $sort: { totalOrders: -1 }
                },
                {
                    $limit: 10
                }
            ]);
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully',
                output: result,
            });
        }
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
});


export {
    // Super Admin
    fetchSuperAdminDashboardData,
    fetchSuperAdminDasboardBarChartData,
    fetchSuperAdminDasboardLineChartData,
    fetchSuperAdminDasboardActivityData,
    fetchDasboardSuperAdminGridData,
    fetchSuperAdminDasboardLineChartDataRevenue,

    // Business User
    fetchBusinessUserDashboardData,
    fetchBusinessUserDasboardBarChartData,
    fetchBusinessUserDasboardLineChartData,
    fetchBusinessUserDasboardLineChartDataOrderRevenue,
    fetchBusinessUserDasboardActivityData,
    fetchDasboardBusinessUserGridData

}