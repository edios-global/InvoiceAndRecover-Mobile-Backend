import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import SubscriptionPlan from '../models/subscriptionPlansModel.js';
import { generateSearchParameterList } from '../routes/genericMethods.js';
import mongoose from 'mongoose';
import BusinessUsers from '../models/businessUsersModel.js';
import InvoicePaymentsModel from '../models/invoicePaymentsModel.js';


const fetchClientReport = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = {}
        var sort = {}
        // var query = { state: { $exists: true }, country: { $exists: true }, userStatus: { $exists: true }, cancellationEffectiveDate: { $exists: true }, activationDate: { $exists: true }, expiryDate: { $exists: true } }
        var Date1 = new Date();
        var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));

        var activationsearchDate;
        var expirySearchDate;
        var cancelSearchDate;

        if (post.activationDuration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.activationDuration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.activationDuration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "MoreThenYear") {
            activationsearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.expiryDuration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.expiryDuration === "next7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 7);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.expiryDuration === "next30Month") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 30);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.expiryDuration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.expiryDuration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "MoreThenYear") {
            expirySearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.cancelDuration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            cancelSearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.cancelDuration === "next7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 7);
            cancelSearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.cancelDuration === "next30Month") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 30);
            cancelSearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.cancelDuration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.cancelDuration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.cancelDuration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.cancelDuration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.cancelDuration === "MoreThenYear") {
            cancelSearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.cancelDuration !== "" && post.cancelDuration !== undefined) {
            query.cancellationEffectiveDate = cancelSearchDate
        }
        if (post.expiryDuration !== "" && post.expiryDuration !== undefined) {
            query.expiryDate = expirySearchDate
        }
        if (post.activationDuration !== "" && post.activationDuration !== undefined) {
            query.activationDate = activationsearchDate
        }
        if (post.searchParameter != undefined && post.searchParameter != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);


        if (post.userStatus != "" && post.userStatus != undefined) {

            query.status = post.userStatus
        }
        if (post.countryName != "" && post.countryName != undefined) {
            query.country = post.countryName
        }
        if (post.stateName != "" && post.stateName != undefined) {
            query.state = post.stateName
        }
        if (post.subsciptionPlanDD != "" && post.subsciptionPlanDD != undefined) {
            query.subscriptionPlan = post.subsciptionPlanDD
        }



        let fetchQuery = [
            {
                $lookup: {
                    from: "users",
                    let: { emailAddress: ["$emailAddress"] },
                    localField: "_id",
                    foreignField: "businessUserID",
                    as: "users",
                    pipeline: [
                        {
                            $match: { $expr: { $in: ["$emailAddress", "$$emailAddress"] } }
                        }
                    ],
                }
            },
            { $unwind: "$users" },
            {
                $lookup: {
                    from: "business_user_plans",
                    localField: "_id",
                    foreignField: "businessUserID",
                    as: "businessuserplans",
                    pipeline: [
                        {
                            $sort: { _id: -1 }
                        },
                        {
                            $limit: 1
                        }
                    ]
                }
            },
            { $unwind: "$businessuserplans" },
            {
                $lookup: {
                    from: "subscription_plans",
                    localField: "businessuserplans.planID",
                    foreignField: "_id",
                    as: "subscriptionplans"
                }
            },
            { $unwind: "$subscriptionplans" },
            {
                $lookup: {
                    from: "countries",
                    localField: "companyCountryId",
                    foreignField: "_id",
                    as: "country"
                }
            },
            { $unwind: "$country" },
            {
                $lookup: {
                    from: "country_states",
                    localField: "companyStateId",
                    foreignField: "_id",
                    as: "states"
                }
            },
            { $unwind: "$states" },
            {
                $lookup: {
                    from: "business_locations",
                    localField: "_id",
                    foreignField: "businessUserID",
                    as: "businesslocations",
                    pipeline: [
                        {
                            $match: { locationStatus: "Active" }
                        }
                    ],
                }
            },
            {

                $project: {
                    clientName: { $concat: ["$firstName", " ", "$lastName"] },
                    subscriptionPlan: "$subscriptionplans.planName",
                    activationDate: "$businessuserplans.planActivationDate",
                    expiryDate: "$businessuserplans.planExpiryDate",
                    emailAddress: "$emailAddress",
                    mobileNumber: "$phoneNumber",
                    website: "$companyWebsite",
                    streetAddress: "$companyStreetAddress",
                    city: "$companyCity",
                    zipCode: "$companyZipCode",
                    country: "$country.countryName",
                    state: "$states.stateName",
                    status: "$users.userStatus",
                    planNameWithTrialUser: { planName: "$subscriptionplans.planName", trialUser: "$trialUser" },
                    activationDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$businessuserplans.planActivationDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$businessuserplans.planActivationDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$businessuserplans.planActivationDate" } },
                        ]
                    },
                    expiryDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$businessuserplans.planExpiryDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$businessuserplans.planExpiryDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$businessuserplans.planExpiryDate" } },
                        ]
                    },
                    cancellationEffectiveDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$planCancellationEffectiveDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$planCancellationEffectiveDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$planCancellationEffectiveDate" } },
                        ]
                    },
                    subscriptionPlanFormatted: {
                        $cond: {
                            if: { $eq: ["$trialUser", 1] },
                            then: { $concat: ["$subscriptionplans.planName", " - Trial"] },
                            else: "$subscriptionplans.planName"
                        }
                    },
                },
            },
            { $match: query }
        ]

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { clientName: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

        let myAggregation = BusinessUsers.aggregate()
        myAggregation._pipeline = fetchQuery
        BusinessUsers.aggregatePaginate(
            myAggregation,
            options,
            async (err, result) => {
                if (err) {
                    console.log("sadadf", err)
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const reportForExport = await BusinessUsers.aggregate(fetchQuery);
                    const successResponse = genericResponse(true, "Report fetched successfully", { clientData: result, exportData: reportForExport });
                    res.status(200).json(successResponse);

                }
            }
        )


    }
    catch (error) {
        console.log("jdvjvddjb", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse)
    }
});


const fetchReportForExport = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = {}
        console.log("dffhkf", post)
        // var query = { state: { $exists: true }, country: { $exists: true }, userStatus: { $exists: true }, cancellationEffectiveDate: { $exists: true }, activationDate: { $exists: true }, expiryDate: { $exists: true } }

        var Date1 = new Date();
        var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));

        var activationsearchDate;
        var expirySearchDate;
        var cancelSearchDate;

        if (post.activationDuration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.activationDuration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.activationDuration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "MoreThenYear") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            activationsearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "MoreThenYear") {
            activationsearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.expiryDuration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.expiryDuration === "next7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 7);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.expiryDuration === "next30Month") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 30);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.expiryDuration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.expiryDuration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            expirySearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "MoreThenYear") {
            expirySearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.cancelDuration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            cancelSearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.cancelDuration === "next7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 7);
            cancelSearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }

        if (post.cancelDuration === "next30Month") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 30);
            cancelSearchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.cancelDuration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.cancelDuration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.cancelDuration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.cancelDuration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            cancelSearchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.cancelDuration === "MoreThenYear") {
            cancelSearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }



        if (post.cancelDuration !== "" && post.cancelDuration !== undefined) {
            query.cancellationEffectiveDate = cancelSearchDate
        }
        if (post.expiryDuration !== "" && post.expiryDuration !== undefined) {
            query.expiryDate = expirySearchDate
        }
        if (post.activationDuration !== "" && post.activationDuration !== undefined) {
            query.activationDate = activationsearchDate

        }
        if (post.searchParameter != undefined && post.searchParameter != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);


        if (post.userStatus != "" && post.userStatus != undefined) {

            query.status = post.userStatus
        }
        if (post.countryName != "" && post.countryName != undefined) {
            query.country = post.countryName
        }
        if (post.stateName != "" && post.stateName != undefined) {
            query.state = post.stateName
        }
        if (post.subsciptionPlanDD != "" && post.subsciptionPlanDD != undefined) {
            query.subscriptionPlan = post.subsciptionPlanDD
        }
        let fetchData = [

            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "businessUserID",
                    as: "users"
                }
            },
            { $unwind: "$users" },
            {
                $lookup: {
                    from: "business_user_plans",
                    localField: "_id",
                    foreignField: "businessUserID",

                    as: "businessuserplans"
                }
            },
            { $unwind: "$businessuserplans" },
            {
                $lookup: {
                    from: "subscription_plans",
                    localField: "businessuserplans.planID",
                    foreignField: "_id",

                    as: "subscriptionplans"
                }
            },
            { $unwind: "$subscriptionplans" },

            {
                $lookup: {
                    from: "business_locations",
                    localField: "_id",
                    foreignField: "businessUserID",
                    pipeline: [
                        {
                            $match: { locationStatus: "Active" }
                        }
                    ],
                    as: "businesslocations"
                }
            },

            {
                $lookup: {
                    from: "countries",
                    localField: "companyCountryId",
                    foreignField: "_id",
                    as: "country"
                }
            },
            { $unwind: "$country" },
            {
                $lookup: {
                    from: "country_states",
                    localField: "companyStateId",
                    foreignField: "_id",

                    as: "states"
                }
            },
            { $unwind: "$states" },
            {

                $project: {
                    clientName: { $concat: ["$firstName", " ", "$lastName"] },
                    subscriptionPlan: "$subscriptionplans.planName",
                    activationDate: "$businessuserplans.planActivationDate",
                    expiryDate: "$businessuserplans.planExpiryDate",
                    emailAddress: "$emailAddress",
                    mobileNumber: "$phoneNumber",
                    website: "$companyWebsite",
                    streetAddress: "$companyStreetAddress",
                    city: "$companyCity",
                    zipCode: "$companyZipCode",
                    country: "$country.countryName",
                    state: "$states.stateName",
                    status: "$users.userStatus",
                    cancellationType: "$cancellationType",
                    cancellationEffectiveDate: "$planCancellationEffectiveDate",
                    businessLocations: "$businesslocations.locationCity",
                    trialUser: "$trialUser",
                },
            },
            { $match: query }
        ]

        const report = await BusinessUsers.aggregate(fetchData).sort({ clientName: 1 })

        let successResponse = genericResponse(true, "Subsciption Transactions fetched successfully.", report);
        res.status(201).json(successResponse);

    }
    catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse)
    }
});


const fetchSubcriptionPlan = asyncHandler(async (req, res) => {

    const post = req.body;
    console.log({ post });
    try {
        var query = { planStatus: 'Active' }
        const fetchPlan = await SubscriptionPlan.find(query)
        let successResponse = genericResponse(true, "Subscription Plan fetched successfully.", fetchPlan);
        res.status(201).json(successResponse);

    } catch (error) {
        console.log(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

})

const fetchInvoicRevenueReport = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = {}
        var Date1 = new Date();
        var sort = {}
        var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var invoiceDate = new Date(Date1.setHours(0, 0, 0, 0));
        var invoiceSearchDate;

        if (post.invoiceDuration === "Today") {
            invoiceDate.setDate(invoiceDate.getDate() + 1);
            invoiceSearchDate = { $gte: new Date(currentDate), $lt: new Date(invoiceDate) }
        }
        else if (post.invoiceDuration === "last7Days") {
            invoiceDate.setDate(invoiceDate.getDate() - 7);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "last30Days") {
            invoiceDate.setDate(invoiceDate.getDate() - 30);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "last6Months") {
            invoiceDate.setMonth(invoiceDate.getMonth() - 6);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "last1Year") {
            invoiceDate.setFullYear(invoiceDate.getFullYear() - 1);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "MoreThenYear") {
            invoiceSearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.invoiceDuration !== "" && post.invoiceDuration !== undefined) {
            query.invoiceDate = invoiceSearchDate
        }
        if (post.searchParameter != undefined && post.searchParameter != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);


        if (post.invoiceStatus != "" && post.invoiceStatus != undefined) {
            query.invoiceStatus = post.invoiceStatus
        }
        if (post.subsciptionPlanDD != "" && post.subsciptionPlanDD != undefined) {
            query.subscriptionPlan = post.subsciptionPlanDD
        }

        let fetchQuery = [

            {
                $lookup: {
                    from: "business_users",
                    localField: "businessUserID",
                    foreignField: "_id",
                    as: "BusinessUsers"
                }
            },
            { $unwind: "$BusinessUsers" },

            {
                $lookup: {
                    from: "users",
                    localField: "BusinessUsers._id",
                    foreignField: "businessUserID",
                    as: "users"
                }
            },
            { $unwind: "$users" },
            {
                $lookup: {
                    from: "business_user_plans",
                    localField: "BusinessUsers._id",
                    foreignField: "businessUserID",
                    pipeline: [
                        {
                            $sort: { _id: -1 }
                        },
                        {
                            $limit: 1
                        }
                    ],
                    as: "businessuserplans"
                }
            },
            { $unwind: "$businessuserplans" },
            {
                $lookup: {
                    from: "subscription_plans",
                    localField: "businessuserplans.planID",
                    foreignField: "_id",

                    as: "subscriptionplans"
                }
            },
            { $unwind: "$subscriptionplans" },

            {
                $lookup: {
                    from: "business_locations",
                    localField: "BusinessUsers._id",
                    foreignField: "businessUserID",
                    pipeline: [
                        {
                            $match: { locationStatus: "Active" }
                        }
                    ],
                    as: "businesslocations"
                }
            },

            {
                $lookup: {
                    from: "countries",
                    localField: "BusinessUsers.companyCountryId",
                    foreignField: "_id",
                    as: "country"
                }
            },
            { $unwind: "$country" },
            {
                $lookup: {
                    from: "country_states",
                    localField: "BusinessUsers.companyStateId",
                    foreignField: "_id",
                    as: "states"
                }
            },
            { $unwind: "$states" },
            {
                $project: {
                    _id: 0,
                    clientName: { $concat: ["$BusinessUsers.firstName", " ", "$BusinessUsers.lastName"] },
                    invoiceDate: '$invoiceDate',
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
                    invoiceNumber: "$invoiceNumber",
                    invoiceAmount: "$invoiceAmount",
                    invoiceAmountString: { $concat: [{ $toString: "$invoiceAmount" }, ""] },
                    transactionType: {
                        $concat: [
                            { "$toUpper": { "$substrCP": ["$transactionType", 0, 1] } },
                            { "$substrCP": ["$transactionType", 1, { "$subtract": [{ "$strLenCP": "$transactionType" }, 1] }] }
                        ]
                    },
                    invoiceStatus: {
                        $concat: [
                            { "$toUpper": { "$substrCP": ["$invoiceStatus", 0, 1] } },
                            { "$substrCP": ["$invoiceStatus", 1, { "$subtract": [{ "$strLenCP": "$invoiceStatus" }, 1] }] }
                        ]
                    },
                    paymentDate: '$paymentDate',
                    paymentDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$paymentDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$paymentDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$paymentDate" } },
                        ]
                    },
                    paymentAmount: "$paymentAmount",
                    paymentAmountString: { $concat: [{ $toString: "$paymentAmount" }, ""] },
                    subscriptionPlan: "$subscriptionplans.planName",
                    subscriptionPlanFormatted: {
                        $cond: {
                            if: { $eq: ["$BusinessUsers.trialUser", 1] },
                            then: { $concat: ["$subscriptionplans.planName", " - Trial"] },
                            else: "$subscriptionplans.planName"
                        }
                    },
                    activationDate: '$businessuserplans.planActivationDate',
                    activationDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$businessuserplans.planActivationDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$businessuserplans.planActivationDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$businessuserplans.planActivationDate" } },
                        ]
                    },
                    expiryDate: '$businessuserplans.planExpiryDate',
                    expiryDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$businessuserplans.planExpiryDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$businessuserplans.planExpiryDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$businessuserplans.planExpiryDate" } },
                        ]
                    },
                    emailAddress: "$BusinessUsers.emailAddress",
                    mobileNumber: "$BusinessUsers.phoneNumber",
                    planNameWithTrialUser: { planName: "$subscriptionplans.planName", trialUser: "$BusinessUsers.trialUser" },
                    city: "$BusinessUsers.companyCity",
                    country: "$country.countryName",
                    state: "$states.stateName",
                    status: "$users.userStatus",
                    businessUserID: 1.

                },
            },
            { $match: query }
        ]
        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { clientName: -1 }
        }

        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

        let myAggregation = InvoicePaymentsModel.aggregate()
        myAggregation._pipeline = fetchQuery
        InvoicePaymentsModel.aggregatePaginate(
            myAggregation,
            options,
            async (err, result) => {
                if (err) {
                    console.log("dfsdf", err)
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const reportForExport = await InvoicePaymentsModel.aggregate(fetchQuery);
                    const successResponse = genericResponse(true, "Report fetched successfully", { clientData: result, exportData: reportForExport });
                    res.status(200).json(successResponse);

                }
            }
        )
    }
    catch (error) {
        console.log("Catch in fetchPaymentAndRevenueReport:", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse)
    }
});

const fetchPaymentAndRevenueReport = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = {}
        var sort = {}
        var Date1 = new Date();
        var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var activationDate = new Date(Date1.setHours(0, 0, 0, 0));
        var expiryDate = new Date(Date1.setHours(0, 0, 0, 0));
        var invoiceDate = new Date(Date1.setHours(0, 0, 0, 0));
        var paymentDate = new Date(Date1.setHours(0, 0, 0, 0));

        var activationsearchDate;
        var expirySearchDate;
        var invoiceSearchDate;
        var paymentSearchDate;
        if (post.activationDuration === "Today") {
            activationDate.setDate(activationDate.getDate() + 1);
            activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(activationDate) }
        }
        if (post.activationDuration === "last7Days") {
            activationDate.setDate(activationDate.getDate() - 7);
            activationsearchDate = { $gte: new Date(activationDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last30Days") {
            activationDate.setDate(activationDate.getDate() - 30);
            activationsearchDate = { $gte: new Date(activationDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last6Months") {
            activationDate.setMonth(activationDate.getMonth() - 6);
            activationsearchDate = { $gte: new Date(activationDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "last1Year") {
            activationDate.setFullYear(activationDate.getFullYear() - 1);
            activationsearchDate = { $gte: new Date(activationDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.activationDuration === "MoreThenYear") {
            activationsearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.expiryDuration === "Today") {
            expiryDate.setDate(expiryDate.getDate() + 1);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(expiryDate) }
        }
        if (post.expiryDuration === "next7Days") {
            expiryDate.setDate(expiryDate.getDate() + 7);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(expiryDate) }
        }
        if (post.expiryDuration === "next30Month") {
            expiryDate.setDate(expiryDate.getDate() + 30);
            expirySearchDate = { $gte: new Date(currentDate), $lt: new Date(expiryDate) }
        }
        if (post.expiryDuration === "last7Days") {
            expiryDate.setDate(expiryDate.getDate() - 7);
            expirySearchDate = { $gte: new Date(expiryDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last30Days") {
            expiryDate.setDate(expiryDate.getDate() - 30);
            expirySearchDate = { $gte: new Date(expiryDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last6Months") {
            expiryDate.setMonth(expiryDate.getMonth() - 6);
            expirySearchDate = { $gte: new Date(expiryDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "last1Year") {
            expiryDate.setFullYear(expiryDate.getFullYear() - 1);
            expirySearchDate = { $gte: new Date(expiryDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.expiryDuration === "MoreThenYear") {
            expirySearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.invoiceDuration === "Today") {
            invoiceDate.setDate(invoiceDate.getDate() + 1);
            invoiceSearchDate = { $gte: new Date(currentDate), $lt: new Date(invoiceDate) }
        }
        else if (post.invoiceDuration === "last7Days") {
            invoiceDate.setDate(invoiceDate.getDate() - 7);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "last30Days") {
            invoiceDate.setDate(invoiceDate.getDate() - 30);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "last6Months") {
            invoiceDate.setMonth(invoiceDate.getMonth() - 6);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "last1Year") {
            invoiceDate.setFullYear(invoiceDate.getFullYear() - 1);
            invoiceSearchDate = { $gte: new Date(invoiceDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        else if (post.invoiceDuration === "MoreThenYear") {
            invoiceSearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }


        if (post.paymentDuration === "Today") {
            paymentDate.setDate(paymentDate.getDate() + 1);
            paymentSearchDate = { $gte: new Date(currentDate), $lt: new Date(paymentDate) }
        }

        if (post.paymentDuration === "last7Days") {
            paymentDate.setDate(paymentDate.getDate() - 7);
            paymentSearchDate = { $gte: new Date(paymentDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        if (post.paymentDuration === "last30Days") {
            paymentDate.setDate(paymentDate.getDate() - 30);
            paymentSearchDate = { $gte: new Date(paymentDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.paymentDuration === "last6Months") {
            paymentDate.setMonth(paymentDate.getMonth() - 6);
            paymentSearchDate = { $gte: new Date(paymentDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.paymentDuration === "last1Year") {
            paymentDate.setFullYear(paymentDate.getFullYear() - 1);
            paymentSearchDate = { $gte: new Date(paymentDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.paymentDuration === "MoreThenYear") {
            paymentSearchDate = { $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.paymentDuration !== "" && post.paymentDuration !== undefined) {
            query.paymentDate = paymentSearchDate
        }


        if (post.invoiceDuration !== "" && post.invoiceDuration !== undefined) {
            query.invoiceDate = invoiceSearchDate
        }
        if (post.expiryDuration !== "" && post.expiryDuration !== undefined) {
            query.expiryDate = expirySearchDate
        }
        if (post.activationDuration !== "" && post.activationDuration !== undefined) {
            query.activationDate = activationsearchDate
        }
        if (post.searchParameter != undefined && post.searchParameter != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);


        if (post.invoiceStatus != "" && post.invoiceStatus != undefined) {
            query.invoiceStatus = post.invoiceStatus
        }
        if (post.countryName != "" && post.countryName != undefined) {
            query.country = post.countryName
        }
        if (post.stateName != "" && post.stateName != undefined) {
            query.state = post.stateName
        }
        if (post.subsciptionPlanDD != "" && post.subsciptionPlanDD != undefined) {
            query.subscriptionPlan = post.subsciptionPlanDD
        }


        let fetchQuery = [
            {
                $lookup: {
                    from: "business_users",
                    localField: "businessUserID",
                    foreignField: "_id",
                    as: "BusinessUsers"
                }
            },
            { $unwind: "$BusinessUsers" },

            {
                $lookup: {
                    from: "users",
                    localField: "BusinessUsers._id",
                    foreignField: "businessUserID",
                    as: "users"
                }
            },
            { $unwind: "$users" },
            {
                $lookup: {
                    from: "business_user_plans",
                    localField: "BusinessUsers._id",
                    foreignField: "businessUserID",
                    pipeline: [
                        {
                            $sort: { _id: -1 }
                        },
                        {
                            $limit: 1
                        }
                    ],
                    as: "businessuserplans"
                }
            },
            { $unwind: "$businessuserplans" },
            {
                $lookup: {
                    from: "subscription_plans",
                    localField: "businessuserplans.planID",
                    foreignField: "_id",

                    as: "subscriptionplans"
                }
            },
            { $unwind: "$subscriptionplans" },

            {
                $lookup: {
                    from: "business_locations",
                    localField: "BusinessUsers._id",
                    foreignField: "businessUserID",
                    pipeline: [
                        {
                            $match: { locationStatus: "Active" }
                        }
                    ],
                    as: "businesslocations"
                }
            },

            {
                $lookup: {
                    from: "countries",
                    localField: "BusinessUsers.companyCountryId",
                    foreignField: "_id",
                    as: "country"
                }
            },
            { $unwind: "$country" },
            {
                $lookup: {
                    from: "country_states",
                    localField: "BusinessUsers.companyStateId",
                    foreignField: "_id",
                    as: "states"
                }
            },
            { $unwind: "$states" },
            {
                $project: {
                    _id: 0,
                    clientName: { $concat: ["$BusinessUsers.firstName", " ", "$BusinessUsers.lastName"] },
                    invoiceDate: '$invoiceDate',
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
                    invoiceNumber: "$invoiceNumber",
                    invoiceAmount: "$invoiceAmount",
                    invoiceAmountString: { $concat: [{ $toString: "$invoiceAmount" }, ""] },
                    transactionType: "$transactionType",
                    transactionType: {
                        $concat: [
                            { "$toUpper": { "$substrCP": ["$transactionType", 0, 1] } },
                            { "$substrCP": ["$transactionType", 1, { "$subtract": [{ "$strLenCP": "$transactionType" }, 1] }] }
                        ]
                    },
                    invoiceStatus: "$invoiceStatus",
                    invoiceStatus: {
                        $concat: [
                            { "$toUpper": { "$substrCP": ["$invoiceStatus", 0, 1] } },
                            { "$substrCP": ["$invoiceStatus", 1, { "$subtract": [{ "$strLenCP": "$invoiceStatus" }, 1] }] }
                        ]
                    },
                    paymentDate: '$paymentDate',
                    paymentDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$paymentDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$paymentDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$paymentDate" } },
                        ]
                    },
                    paymentAmount: "$paymentAmount",
                    paymentAmountString: { $concat: [{ $toString: "$paymentAmount" }, ""] },
                    subscriptionPlan: "$subscriptionplans.planName",
                    subscriptionPlanFormatted: {
                        $cond: {
                            if: { $eq: ["$BusinessUsers.trialUser", 1] },
                            then: { $concat: ["$subscriptionplans.planName", " - Trial"] },
                            else: "$subscriptionplans.planName"
                        }
                    },
                    activationDate: '$businessuserplans.planActivationDate',
                    activationDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$businessuserplans.planActivationDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$businessuserplans.planActivationDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$businessuserplans.planActivationDate" } },
                        ]
                    },
                    expiryDate: '$businessuserplans.planExpiryDate',
                    expiryDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$businessuserplans.planExpiryDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$businessuserplans.planExpiryDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$businessuserplans.planExpiryDate" } },
                        ]
                    },
                    emailAddress: "$BusinessUsers.emailAddress",
                    mobileNumber: "$BusinessUsers.phoneNumber",
                    planNameWithTrialUser: { planName: "$subscriptionplans.planName", trialUser: "$BusinessUsers.trialUser" },
                    city: "$BusinessUsers.companyCity",
                    country: "$country.countryName",
                    state: "$states.stateName",
                    status: "$users.userStatus",
                },
            },
            { $match: query }
        ]


        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { clientName: -1 }
        }

        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

        let myAggregation = InvoicePaymentsModel.aggregate()
        myAggregation._pipeline = fetchQuery
        InvoicePaymentsModel.aggregatePaginate(
            myAggregation,
            options,
            async (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const reportForExport = await InvoicePaymentsModel.aggregate(fetchQuery);
                    const successResponse = genericResponse(true, "Report fetched successfully", { clientData: result, exportData: reportForExport });
                    res.status(200).json(successResponse);

                }
            }
        )

    }
    catch (error) {
        console.log("Catch in fetchPaymentAndRevenueReport:", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse)
    }
});
export {
    fetchClientReport, fetchSubcriptionPlan, fetchReportForExport, fetchInvoicRevenueReport, fetchPaymentAndRevenueReport,
}