import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import { generateSearchParameterList, updateToObjectType } from '../routes/genericMethods.js';
import mongoose from 'mongoose';
import ReviewRequest from '../models/reviewRequestsModel.js';
import businessLocation from '../models/businessLocationModel.js';
import businessReviewLink from '../models/businessReviewLinkModel.js';
import { validateRequest } from 'twilio/lib/webhooks/webhooks.js';
import OnlineReview from '../models/onlineReviewsModel.js';

export async function updateToExitsType(selectedList) {
    try {
        return new Promise(resolve => {
            resolve((selectedList).map((item, i) => {
                return (
                    { [item]: { $exists: true } }
                )
            }));
        });
    } catch (error) {
        console.log("Catch in generatePassword==", error);
    }
};

const fetchFirstPartyReviews = asyncHandler(async (req, res) => {
    try {
        var Date1 = new Date();
        var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var searchDate;
        const post = req.body;

        if (post.duration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            searchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.duration === "last1Day") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 1);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) };
        }
        if (post.duration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last15Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 15);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        post.customOrder = Number.parseInt(post.customOrder);
        var mysort = { responseDateTime: -1 };
        if (post.customSort === 'responseDateTime')
            mysort = { responseDateTime: post.customOrder };
        else if (post.customSort === 'customerFullName')
            mysort = { customerFullName: post.customOrder };
        else if (post.customSort === 'phoneNumber')
            mysort = { phoneNumber: post.customOrder };
        else if (post.customSort === 'emailAddress')
            mysort = { emailAddress: post.customOrder };
        else if (post.customSort === 'responseRating')
            mysort = { responseRating: post.customOrder };
        else if (post.customSort === 'jobID')
            mysort = { jobID: post.customOrder };
        else if (post.customSort === 'customerID')
            mysort = { customerID: post.customOrder };

        var query = {
            businessUserID: mongoose.Types.ObjectId(post.businessUserID), responseDateTime: { $exists: true },
            businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
        };

        if (post.duration !== undefined && post.duration !== '') {
            query.responseDateTime = searchDate;
        }
        // if (post.startDate && post.startDate != '')
        //     query.requestDateTime = { $gte: new Date(post.startDate), $lte: new Date(post.endDate) }
        // if (post.businessLocationIDs && post.businessLocationIDs.length > 0)
        //     query.businessLocationID = { $in: await updateToObjectType(post.businessLocationIDs) }
        // if (post.reviewType && post.reviewType.length > 0)
        //     query.reviewType = { $in: post.reviewType }
        if (post.startRatings && post.startRatings.length > 0)
            query.responseRating = { $in: post.startRatings }
        if (post.actions && post.actions.length > 0) {
            query.$or = await updateToExitsType(post.actions)
        }
        // if (post.reviewWebsites && post.reviewWebsites.length > 0)
        //     query.reviewWebsite = { $in: post.reviewWebsites }

        // this query may have 2 $or so have used {$and : [{},{}] }
        if (post.searchParameter != undefined && post.searchParameter != '') {
            const generatedSearchList = { $or: await generateSearchParameterList(post.searchParameterList, post.searchParameter) }
            query = { $and: [query, generatedSearchList] };
        }

        var fieldsToBeFetched = {
            businessUserID:1, businessLocationID: 1,
            firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1, communicationType: 1, requestSource: 1, requestDateTime: 1,
            responseRating: 1, responseDateTime: 1, requestText: 1, requestStatus: 1, responseFeedback: 1,
            customerFullName: { $concat: ["$firstName", " ", "$lastName"] }, jobID: 1, customerID: 1,
        };

        const fetchQuery = [
            {
                $project: fieldsToBeFetched
            },
            {
                $match: query
            },
        ];

        const reviewRatingsCount = await (await ReviewRequest.aggregate(fetchQuery)).length;
        const reviewRatingsList = await ReviewRequest.aggregate(fetchQuery).sort(mysort).skip(post.initialValue).limit(post.finalValue);

        let successResponse = genericResponse(true, "ReviewRequest fetched successfully.", {
            count: reviewRatingsCount,
            list: reviewRatingsList
        });
        res.status(201).json(successResponse);
    }
    catch (error) {
        console.log("Catch in fetchFirstPartyReviews: ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});

const fetchBuisnessLocations = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var mysort = { _id: -1 };
        var query = {
            businessUserID: mongoose.Types.ObjectId(post.businessUserID), locationStatus: 'Active',
            _id: mongoose.Types.ObjectId(post.businessLocationID),
        };

        let fetchQuery = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "country_states",
                    localField: "stateId",
                    foreignField: "_id",
                    as: "states",
                }
            },
            { $unwind: "$states" },
            {
                $lookup: {
                    from: "countries",
                    localField: "countryId",
                    foreignField: "_id",
                    as: "country"
                }
            },
            { $unwind: "$country" },
            {
                $project: {
                    stateNameWithCountry: { $concat: ["$states.stateName", ", ", "$country.countryName"] },
                    streetWithCity: { $concat: ["$locationStreetAddress", ", ", "$locationCity"] }, defaultLocation: "$defaultLocation",
                }
            }
        ];
        const businessLocationIDList = await businessLocation.aggregate(fetchQuery).sort({ streetWithCity: 1 });

        let successResponse = genericResponse(true, "fetchBuisnessLocations fetched successfully.", businessLocationIDList);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});

const fetchBuisnessReviewLinks = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        var query = {
            businessUserID: mongoose.Types.ObjectId(post.businessUserID), locationStatus: 'Active',
            businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
        };

        let fetchQuery = [
            {
                $group: {}
            }
        ];
        const fetchBuisnessReviewLinks = await businessReviewLink.distinct("reviewSiteName").sort();

        let successResponse = genericResponse(true, "fetchBuisnessReviewLinks fetched successfully.", fetchBuisnessReviewLinks);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});

const fetchThirdPartyReviews = asyncHandler(async (req, res) => {
    try {
        var Date1 = new Date();
        var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
        var searchDate;
        const post = req.body;

        if (post.duration === "Today") {
            tommorrowDate.setDate(tommorrowDate.getDate() + 1);
            searchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
        }
        if (post.duration === "last1Day") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 1);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) };
        }
        if (post.duration === "last7Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 7);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last15Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 15);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last30Days") {
            tommorrowDate.setDate(tommorrowDate.getDate() - 30);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last6Months") {
            tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }
        if (post.duration === "last1Year") {
            tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
            searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
        }

        post.customOrder = Number.parseInt(post.customOrder);
        var mysort = { responseDateTime: -1 };
        if (post.customSort === 'responseDateTime')
            mysort = { responseDateTime: post.customOrder };
        else if (post.customSort === 'customerFullName')
            mysort = { customerName: post.customOrder };
        // else if (post.customSort === 'phoneNumber')
        //     mysort = { phoneNumber: post.customOrder };
        // else if (post.customSort === 'emailAddress')
        //     mysort = { emailAddress: post.customOrder };
        else if (post.customSort === 'responseRating')
            mysort = { responseRating: post.customOrder };

        var query = {
            businessUserID: mongoose.Types.ObjectId(post.businessUserID),
            businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
            //  requestText: { $exists: false },
        };

        if (post.duration !== undefined && post.duration !== '') {
            query.responseDateTime = searchDate;
        }
        // if (post.startDate && post.startDate != '')
        //     query.responseDateTime = { $gte: new Date(post.startDate), $lte: new Date(post.endDate) }
        // if (post.businessLocationIDs && post.businessLocationIDs.length > 0)
        //     query.businessLocationID = { $in: await updateToObjectType(post.businessLocationIDs) }
        // if (post.reviewType && post.reviewType.length > 0)
        //     query.reviewType = { $in: post.reviewType }
        if (post.startRatings && post.startRatings.length > 0)
            query.responseRating = { $in: post.startRatings }
        // if (post.actions && post.actions.length > 0) {
        //     query.$or = await updateToExitsType(post.actions)
        // }
        if (post.reviewWebsites && post.reviewWebsites.length > 0)
            query.reviewWebsite = { $in: post.reviewWebsites }

        // this query may have 2 $or so have used {$and : [{},{}] }
        if (post.searchParameter != undefined && post.searchParameter != '') {
            query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter)
        }


        var fieldsToBeFetched = {
            businessUserID: 1, businessLocationID: 1,
            customerName: 1, profilePictureFileName: 1, reviewWebsite: 1, responseDateTime: 1, responseRating: 1,
            responseFeedback: 1, reviewURL: 1, customerProfileURL: 1, reviewSiteLink: "$businessReviewLinks.reviewSiteLink"
        };

        const fetchQuery = [
            {
                $lookup: {
                    from: "business_review_links",
                    localField: "businessReviewLinkID",
                    foreignField: "_id",
                    as: "businessReviewLinks",
                }
            },
            { $unwind: "$businessReviewLinks" },
            {
                $project: fieldsToBeFetched
            },
            {
                $match: query
            },
        ];

        const reviewRatingsCount = await (await OnlineReview.aggregate(fetchQuery)).length;
        const reviewRatingsList = await OnlineReview.aggregate(fetchQuery).sort(mysort).skip(post.initialValue).limit(post.finalValue);

        let successResponse = genericResponse(true, "fetchThirdPartyReviews fetched successfully.", {
            count: reviewRatingsCount,
            list: reviewRatingsList
        });
        res.status(201).json(successResponse);
    } catch (error) {
        console.log("error:", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});

export {

    fetchFirstPartyReviews,
    fetchBuisnessLocations,
    fetchBuisnessReviewLinks,
    fetchThirdPartyReviews,
}