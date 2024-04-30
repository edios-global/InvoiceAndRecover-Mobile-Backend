import asyncHandler from 'express-async-handler'
import PlanFeatures from '../../models/planFeaturesModel.js';
import genericResponse from '../../routes/genericWebResponses.js';
import { generateSearchParameterList } from '../../routes/genericMethods.js';
import mongoose from 'mongoose';
import StandardFeatures from '../../models/standardFeautresModel.js';
import SubscriptionPlan from '../../models/subscriptionPlansModel.js';
import PlanFeaturesSlab from '../../models/planFeaturesSlabModel.js';


const addPlanFeature = asyncHandler(async (req, res) => {
    try {
        const checkIfPlanFeatureAlredyExist = await PlanFeatures.find({ planID: mongoose.Types.ObjectId(req.body.planID), featureID: mongoose.Types.ObjectId(req.body.featureID) });
        if (checkIfPlanFeatureAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Plan Feature already exist in this plan.", []);
            res.status(201).json(successResponse);
            return;
        }
        const addedPlanFeature = await new PlanFeatures(req.body).save();
        if (addedPlanFeature) {
            const slabWise = req.body.slabWiseList;
            let planFeaturesSlab;
            for (let i = 0; i < slabWise.length; i++) {
                planFeaturesSlab = new PlanFeaturesSlab(slabWise[i]);
                planFeaturesSlab.planFeatureID = addedPlanFeature._id;
                // planFeaturesSlab.createdDate = currentDate;
                await planFeaturesSlab.save();
            }

        }
        let successResponse = genericResponse(true, "PlanFeature added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchPlanFeatures = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {};
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);


        const fetchQuery = [

            {
                $lookup: {
                    from: "subscription_plans",
                    localField: "planID",
                    foreignField: "_id",
                    as: "subscriptionPlans"
                }
            },
            { $unwind: "$subscriptionPlans" },
            {
                $lookup: {
                    from: "standard_features",
                    localField: "featureID",
                    foreignField: "_id",
                    as: "standardFeatures"
                }
            },
            { $unwind: "$standardFeatures" },
            {
                $lookup: {
                    from: "plan_features_slabs",
                    localField: "_id",
                    foreignField: "planFeatureID",
                    as: "planFeatureSlabs"
                }
            },
            {
                $project: {
                    'subscriptionPlans.planName': 1, 'standardFeatures.featureName': 1, 'standardFeatures.featureType': 1, featureStatus: 1,
                    planSequence: "$subscriptionPlans.planSequence", featureCount: 1, featureSequence: "$standardFeatures.featureSequence",
                    featureSequenceString: { $concat: [{ $toString: "$standardFeatures.featureSequence" }, ""] },
                    featureCountWithType: { featureCount: '$featureCount', featureType: '$standardFeatures.featureType' },
                    featureCountString: { $concat: [{ $toString: "$featureCount" }, ""] },
                    selectionBasedValueWithType: { selectionBasedValue: '$selectionBasedValue', featureType: '$standardFeatures.featureType' },
                    planID: 1,
                    fromSlabValue: "$planFeatureSlabs.fromSlabValue",
                    toSlabValue: "$planFeatureSlabs.toSlabValue", slabRate: "$planFeatureSlabs.slabRate",
                }
            },
            {
                $match: query
            },

        ];

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

        if (post.planID !== "All") {
            query.planID = post.planID;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = PlanFeatures.aggregate()
        myAggregation._pipeline = fetchQuery
        PlanFeatures.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "SubscriptionPlan fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("Catch in fetchStandardFeatures: ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    };


});

// const fetchPlanFeatures = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;
//         var mysort = { planSequence: 1, featureSequence: 1, };
//         var query = {};
//         if (post.planID != 'All')
//             query.planID = mongoose.Types.ObjectId(post.planID)
//         if (post.searchParameter != undefined && post.searchParameter != '')
//             query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

//         var fieldsToBeFetched = {
//             'subscriptionPlans.planName': 1, 'standardFeatures.featureName': 1, 'standardFeatures.featureType': 1, featureStatus: 1,
//             planSequence: "$subscriptionPlans.planSequence", featureCount: 1, featureSequence: "$standardFeatures.featureSequence",
//             featureSequenceString: { $concat: [{ $toString: "$standardFeatures.featureSequence" }, ""] },
//             featureCountWithType: { featureCount: '$featureCount', featureType: '$standardFeatures.featureType' },
//             featureCountString: { $concat: [{ $toString: "$featureCount" }, ""] },
//             selectionBasedValueWithType: { selectionBasedValue: '$selectionBasedValue', featureType: '$standardFeatures.featureType' },
//             planID: 1,
//             fromSlabValue: "$planFeatureSlabs.fromSlabValue",
//             toSlabValue: "$planFeatureSlabs.toSlabValue", slabRate: "$planFeatureSlabs.slabRate",
//         };
//         const fetchQuery = [
//             {
//                 $match: query
//             },
//             {
//                 $lookup: {
//                     from: "subscription_plans",
//                     localField: "planID",
//                     foreignField: "_id",
//                     as: "subscriptionPlans"
//                 }
//             },
//             { $unwind: "$subscriptionPlans" },
//             {
//                 $lookup: {
//                     from: "standard_features",
//                     localField: "featureID",
//                     foreignField: "_id",
//                     as: "standardFeatures"
//                 }
//             },
//             { $unwind: "$standardFeatures" },
//             {
//                 $lookup: {
//                     from: "plan_features_slabs",
//                     localField: "_id",
//                     foreignField: "planFeatureID",
//                     as: "planFeatureSlabs"
//                 }
//             },
//             {
//                 $project: fieldsToBeFetched
//             },

//         ];

//         const fetchPlanFeaturesCount = await (await PlanFeatures.aggregate(fetchQuery)).length;
//         const fetchPlanFeaturesList = await PlanFeatures.aggregate(fetchQuery).sort(mysort);

//         let successResponse = genericResponse(true, "fetchPlanFeaturesList fetched successfully.", fetchPlanFeaturesList);
//         res.status(201).json(successResponse);
//     } catch (error) {
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(200).json(errorRespnse);
//     }

// });

const updatePlanFeature = asyncHandler(async (req, res) => {
    try {
        var query = { _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, planID: mongoose.Types.ObjectId(req.body.planID), featureID: mongoose.Types.ObjectId(req.body.featureID) } //_id: { $ne: mongoose.Types.ObjectId(req.body._id) }, featureName: { '$regex': '^' + req.body.featureName.trim() + '$', '$options': 'i' } };
        const checkIfFeatureNameAlredyExist = await PlanFeatures.find(query);
        if (checkIfFeatureNameAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Feature Name Already Exist", []);
            res.status(201).json(successResponse);
            return;
        }
        const updatePlanFeature = req.body;
        updatePlanFeature.recordType = 'U';
        updatePlanFeature.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: updatePlanFeature }
        const updatedPlanFeature = await PlanFeatures.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
        if (updatedPlanFeature) {
            const slabWiseList = updatePlanFeature.slabWiseList
            let updatePlanFeaturesSlab;
            for (let i = 0; i < slabWiseList.length; i++) {
                if (slabWiseList[i]._id) {
                    const updatedPlanFeature = await PlanFeaturesSlab.updateOne(
                        { _id: mongoose.Types.ObjectId(slabWiseList[i]._id) }, { $set: slabWiseList[i] });


                }
                else {
                    updatePlanFeaturesSlab = new PlanFeaturesSlab(slabWiseList[i]);
                    updatePlanFeaturesSlab.planFeatureID = updatePlanFeature._id;
                    await updatePlanFeaturesSlab.save();
                }
            }
        }

        let successResponse = genericResponse(true, "PlanFeature updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deletePlanFeature = asyncHandler(async (req, res) => {
    try {
        if (req.body._id != undefined && req.body._id != '') {
            const fetchedStandardPlanFeature = await PlanFeatures.find({
                _id: { $in: (req.body._id) },
            });
            const standardPlanFeature = fetchedStandardPlanFeature[0];

            if (standardPlanFeature) {
                await standardPlanFeature.remove();
                await PlanFeaturesSlab.deleteMany({ planFeatureID: { $in: req.body._id } });
                let successResponse = genericResponse(true, "deletePlanFeature deleted successfully.", []);
                res.status(200).json(successResponse);
            } else {
                let errorRespnse = genericResponse(false, "deletePlanFeature not found.", []);
                res.status(200).json(errorRespnse);
            }
        }
        else {
            let errorRespnse = genericResponse(false, "Standard Plan Feature not found.", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deletPlanFeatureSlab = asyncHandler(async (req, res) => {
    try {
        if (req.body._id != undefined && req.body._id != '') {
            var myquery = { _id: req.body._id };
            const users = await PlanFeaturesSlab.deleteOne(myquery)
            res.json(genericResponse(true, 'PlanFeaturesSlab deleted successfully.', []));
        }
        else
            res.status(201).json(genericResponse(true, 'PlanFeaturesSlab not found', []))
    } catch (error) {
        res.status(200).json(genericResponse(false, error.message, []))
    }

})

const fetchPlanFeatureById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        if (post._id != undefined && post._id != '') {

            const planFeature = await PlanFeatures.aggregate(
                [

                    {
                        $lookup:
                        {
                            from: 'plan_features_slabs',
                            localField: '_id',
                            foreignField: 'planFeatureID',
                            as: 'slabWiseList',
                        },
                    },
                    {
                        $match: query
                    },
                ]
            );

            res.status(201).json(genericResponse(true, 'PlanFeature fetched successfully', planFeature));
        }
        else
            res.status(201).json(genericResponse(false, 'PlanFeature not found', []))

    } catch (error) {
        console.log("Catch in fetchPlanFeatureById:", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchFeatureNames = asyncHandler(async (req, res) => {
    try {
        // const post = req.body;
        var mysort = { featureName: 1 };
        // var mycollection = { locale: "en", caseLevel: true };
        var query = { featureStatus: "Active" };
        var fieldsToBeFetched = {
            featureName: "$featureName", featureType: 1
        }
        // if (post.searchParameter != undefined && post.searchParameter != '')
        //     query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
        const fetchFeatureNames = await StandardFeatures.find(query, fieldsToBeFetched).sort(mysort);
        let successResponse = genericResponse(true, "fetchFeatureNames fetched successfully.", fetchFeatureNames);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});

const fetchPlanNames = asyncHandler(async (req, res) => {
    try {
        // const post = req.body;
        var mysort = { planSequence: 1 };
        // var mycollection = { locale: "en", caseLevel: true };
        var query = { planStatus: "Active" };
        var fieldsToBeFetched = {
            planName: "$planName"
        }
        // if (post.searchParameter != undefined && post.searchParameter != '')
        //     query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
        const fetchPlanNames = await SubscriptionPlan.find(query, fieldsToBeFetched).sort(mysort);
        let successResponse = genericResponse(true, "fetchPlanNames fetched successfully.", fetchPlanNames);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});


export {
    addPlanFeature,
    fetchPlanFeatures,
    updatePlanFeature,
    deletePlanFeature,
    fetchPlanFeatureById,
    fetchPlanNames,
    fetchFeatureNames,
    deletPlanFeatureSlab

}