import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import businessReviewLink from '../models/businessReviewLinkModel.js';
import { updateToObjectType, yelpAPI } from '../routes/genericMethods.js';
import OnlineReview from '../models/onlineReviewsModel.js';

const fetchBusinessReviewLink = asyncHandler(async (req, res) => {
    try {
        let post = req.body;
        const fetchBusinessReviewLink = await businessReviewLink.aggregate([
            {
                $lookup: {
                    from: "business_locations",
                    localField: "businessLocationID",
                    foreignField: "_id",
                    as: "businessLocations"
                }
            },
            {
                $unwind: "$businessLocations"
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "businessLocations.countryId",
                    foreignField: "_id",
                    as: "countries"
                }
            },
            {
                $unwind: "$countries"
            },
            {
                $lookup: {
                    from: "country_states",
                    localField: "businessLocations.stateId",
                    foreignField: "_id",
                    as: "countryStates"
                }
            },
            {
                $unwind: "$countryStates"
            },
            {
                $project: {
                    reviewSiteName: "$reviewSiteName", reviewSiteLink: "$reviewSiteLink", askForReviews: "$askForReviews",
                    monitorOnlineReviews: "$monitorOnlineReviews", reviewSiteSequence: 1,
                    stateNameWithCountry: { $concat: ["$countryStates.stateName", ", ", "$countries.countryName"] },
                    streetWithCity: { $concat: ["$businessLocations.locationStreetAddress", ", ", "$businessLocations.locationCity"] },
                    createdDate: '$createdDate', businessLocationID: "$businessLocationID", businessUserID: "$businessUserID"
                }
            },
            {
                $match: {
                    businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID)
                }
            },
            {
                $sort: { reviewSiteSequence: 1 }
            }
        ]);
        let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchBusinessReviewLink);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchCountry  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchBusinessReviewLinkById = asyncHandler(async (req, res) => {
    try {
        const fetchBusinessReviewLinkById = await businessReviewLink.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(req.body._id) }
            },
            {
                $lookup: {
                    from: "business_locations",
                    localField: "businessLocationID",
                    foreignField: "_id",
                    as: "businessLocations"
                }
            },
            {
                $unwind: "$businessLocations"
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "businessLocations.countryId",
                    foreignField: "_id",
                    as: "countries"
                }
            },
            {
                $unwind: "$countries"
            },
            {
                $lookup: {
                    from: "country_states",
                    localField: "businessLocations.stateId",
                    foreignField: "_id",
                    as: "countryStates"
                }
            },
            {
                $unwind: "$countryStates"
            },
            {
                $project: {
                    reviewSiteName: "$reviewSiteName", reviewSiteLink: "$reviewSiteLink", askForReviews: "$askForReviews",
                    monitorOnlineReviews: "$monitorOnlineReviews",
                    stateNameWithCountry: { $concat: ["$countryStates.stateName", ", ", "$countries.countryName"] },
                    streetWithCity: { $concat: ["$businessLocations.locationStreetAddress", ", ", "$businessLocations.locationCity"] },
                    createdDate: '$createdDate', businessLocationID: "$businessLocationID", reviewBusinessName: 1,
                    reviewBusinessAddress: 1
                }
            },
            {
                $sort: { createdDate: -1 }
            }
        ]);
        let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchBusinessReviewLinkById);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchBusinessReviewLinkById  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const addBusinessReviewLink = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const query = { reviewSiteName: post.reviewSiteName, businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) };
        const checkIfSiteNameAlredyExist = await businessReviewLink.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "business_locations",
                    localField: "businessLocationID",
                    foreignField: "_id",
                    as: "businessLocations"
                }
            },
            {
                $unwind: "$businessLocations"
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "businessLocations.countryId",
                    foreignField: "_id",
                    as: "countries"
                }
            },
            {
                $unwind: "$countries"
            },
            {
                $lookup: {
                    from: "country_states",
                    localField: "businessLocations.stateId",
                    foreignField: "_id",
                    as: "countryStates"
                }
            },
            {
                $unwind: "$countryStates"
            },
            {
                $project: {
                    reviewSiteName: "$reviewSiteName",
                    stateNameWithCountry: { $concat: ["$countryStates.stateName", ", ", "$countries.countryName"] },
                    streetWithCity: { $concat: ["$businessLocations.locationStreetAddress", ", ", "$businessLocations.locationCity"] },
                }
            }
        ]);

        if (checkIfSiteNameAlredyExist.length > 0) {
            let successResponse = genericResponse(
                false,
                `Review Site (${checkIfSiteNameAlredyExist[0].reviewSiteName}) is already configured for this Business Location (${checkIfSiteNameAlredyExist[0].streetWithCity})`,
                []
            );
            res.status(201).json(successResponse);
            return;
        }

        const reviewSiteSequenceQuery = { businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) };
        const lastReviewSiteSequence = await businessReviewLink.find(reviewSiteSequenceQuery, { reviewSiteSequence: 1 }).sort({ reviewSiteSequence: -1 });
        if (lastReviewSiteSequence.length > 0) {
            post.reviewSiteSequence = lastReviewSiteSequence[0].reviewSiteSequence + 1;
        }
        else post.reviewSiteSequence = 1;

        // Don't delete this commented code
        // if (post.reviewSiteName == 'Yelp') {
        //     const yelpLink = 'https://www.yelp.com/biz/'
        //     if (post.reviewSiteLink.startsWith(yelpLink)) {
        //         const buisnessAlias = (post.reviewSiteLink.substring(yelpLink.length));
        //         const buisnessDetails = await yelpAPI(buisnessAlias);
        //         if (buisnessDetails && buisnessDetails.id) {
        //             post.reviewSiteID = buisnessDetails.id;

        //         }
        //         else {
        //             let successResponse = genericResponse(false, `Yelp Buisness Page is not valid.`, []);
        //             res.status(201).json(successResponse);
        //             return;
        //         }
        //     }
        //     else {
        //         let successResponse = genericResponse(false, `Yelp Buisness Page is not valid.`, []);
        //         res.status(201).json(successResponse);
        //         return;
        //     }
        // }

        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

        const addBusinessReviewLink = await new businessReviewLink(post).save();

        // Don't delete this commented code
        // if (addBusinessReviewLink && addBusinessReviewLink.monitorOnlineReviews == 1) {
        //     const buisnessReviews = await yelpAPI(post.reviewSiteID + "/reviews");
        //     if (buisnessReviews && buisnessReviews.reviews) {
        //         const reviews = {
        //             businessUserID: post.businessUserID,
        //             businessLocationID: post.businessLocationID,
        //             reviewWebsite: post.reviewSiteName,
        //             businessReviewLinkID: addBusinessReviewLink._id
        //         }

        //         await buisnessReviews.reviews.forEach(async element => {
        //             reviews.responseDateTime = new Date(element.time_created);
        //             reviews.responseRating = element.rating;
        //             reviews.responseFeedback = element.text;
        //             reviews.reviewID = element.id;
        //             reviews.reviewURL = element.url;
        //             reviews.customerName = element.user.name;
        //             reviews.customerProfileID = element.user.id;
        //             reviews.customerProfileURL = element.user.profile_url;
        //             reviews.profilePictureFileName = element.user.image_url;

        //             await new OnlineReview(reviews).save();
        //         });
        //     }
        // }

        let successResponse = genericResponse(true, "Business Review Link added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const checkIfSiteNameAlredyExist = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const query = { reviewSiteName: post.reviewSiteName, businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) }
        const checkIfSiteNameAlredyExist = await businessReviewLink.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "business_locations",
                    localField: "businessLocationID",
                    foreignField: "_id",
                    as: "businessLocations"
                }
            },
            {
                $unwind: "$businessLocations"
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "businessLocations.countryId",
                    foreignField: "_id",
                    as: "countries"
                }
            },
            {
                $unwind: "$countries"
            },
            {
                $lookup: {
                    from: "country_states",
                    localField: "businessLocations.stateId",
                    foreignField: "_id",
                    as: "countryStates"
                }
            },
            {
                $unwind: "$countryStates"
            },
            {
                $project: {
                    reviewSiteName: "$reviewSiteName",
                    stateNameWithCountry: { $concat: ["$countryStates.stateName", ", ", "$countries.countryName"] },
                    streetWithCity: { $concat: ["$businessLocations.locationStreetAddress", ", ", "$businessLocations.locationCity"] },
                }
            }
        ]);
        let successResponse = {}
        if (checkIfSiteNameAlredyExist.length > 0) {
            successResponse = genericResponse(
                false,
                `Review Site (${checkIfSiteNameAlredyExist[0].reviewSiteName}) is already configured for this Business Location (${checkIfSiteNameAlredyExist[0].streetWithCity})`,
                []
            );
        }
        else
            successResponse = genericResponse(true, "Business Review Link added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const updateBusinessReviewLink = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "U";
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        var newValues = { $set: post };
        const updateBusinessReview = await businessReviewLink.updateOne(query, newValues);
        let successResponse = genericResponse(true, "Business Review Link updated successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const changeReviewSiteSequence = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log(post);
        if (post.length > 0) {
            const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            const newChanges = {};
            newChanges.lastModifiedDate = currentDate;
            newChanges.recordType = "U";
            // return;
            await new Promise((resolve, reject) => {
                post.forEach(async (element, index, array) => {
                    newChanges.reviewSiteSequence = index + 1;
                    var query = { _id: mongoose.Types.ObjectId(element._id) };
                    var newValues = { $set: newChanges };
                    const updateBusinessReview = await businessReviewLink.updateOne(query, newValues);
                    resolve(post);
                });
            });

            let successResponse = genericResponse(true, "Business Review Link Sequence updated successfully.", []);
            res.status(201).json(successResponse);
        }
        else {
            let successResponse = genericResponse(false, "No Business Review Link found.", []);
            res.status(201).json(successResponse);
        }

    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteBusinessReviewLink = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        if (post._id != undefined && post._id != '') {
            await OnlineReview.deleteMany({ reviewWebsite: post.reviewSiteName, businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) })
            await businessReviewLink.deleteOne(query);
            res.status(200).json(genericResponse(true, 'Business Review Link deleted sucessfully', []))
        }
        else
            res.status(400).json(genericResponse(false, "ID can't be blank!", []))
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }

});

const fetchCountOfOnlineReviewOfBuisnessReviewLink = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const query = { reviewWebsite: post.reviewSiteName, businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) }
        const fetchCountOfOnlineReviewOfBuisnessReviewLink = await OnlineReview.find(query).count();
        res.status(200).json(genericResponse(true, 'Business Review Link deleted sucessfully', fetchCountOfOnlineReviewOfBuisnessReviewLink))
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }

});


export {
    fetchBusinessReviewLink,
    addBusinessReviewLink,
    deleteBusinessReviewLink,
    updateBusinessReviewLink,
    checkIfSiteNameAlredyExist,
    fetchCountOfOnlineReviewOfBuisnessReviewLink,
    fetchBusinessReviewLinkById, changeReviewSiteSequence
}