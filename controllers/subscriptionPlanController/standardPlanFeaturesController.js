import asyncHandler from 'express-async-handler'
import StandardFeatures from '../../models/standardFeautresModel.js';
import genericResponse from '../../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from '../../routes/genericMethods.js';
import PlanFeatures from '../../models/planFeaturesModel.js';


const addStandardFeature = asyncHandler(async (req, res) => {
    try {
        const checkIfStandardFeatureAlredyExist = await StandardFeatures.find({ featureName: req.body.featureName });
        if (checkIfStandardFeatureAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "StandardFeature Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        let lastFeatureCode = await StandardFeatures.find({}, { featureCode: 1 }).sort({ featureCode: -1 }).limit(1);

        if (lastFeatureCode.length == 0)
            req.body.featureCode = 1
        else
            req.body.featureCode = lastFeatureCode[0].featureCode + 1
        const addedStandardFeature = await new StandardFeatures(req.body).save();
        let successResponse = genericResponse(true, "StandardFeature added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchStandardFeatures = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {};
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

        const fetchQuery = [

            {
                $project: {
                    featureName: "$featureName",
                    featureType: "$featureType",
                    featureSequence: "$featureSequence",
                    featureStatus: "$featureStatus",
                    featureSequenceString: { $concat: [{ $toString: "$featureSequence" }, ""] }
                },
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
        if (post.featureStatus !== "All") {
            query.featureStatus = post.featureStatus;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = StandardFeatures.aggregate()
        myAggregation._pipeline = fetchQuery
        StandardFeatures.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "feature Status fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("Catch in fetchStandardFeatures: ", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const updateStandardFeature = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, featureName: { '$regex': '^' + req.body.featureName.trim() + '$', '$options': 'i' } };
        const checkIfFeatureNameAlredyExist = await StandardFeatures.find(query);
        if (checkIfFeatureNameAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Feature Name Already Exist", []);
            res.status(201).json(successResponse);
            return;
        }

        var featureSequenceQuery = { _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, featureSequence: post.featureSequence };
        const checkIfFeatureSequenceAlredyExist = await StandardFeatures.find(featureSequenceQuery);
        if (checkIfFeatureSequenceAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Feature Sequence already exist", []);
            res.status(201).json(successResponse);
            return;
        }

        // Checking if Feature has been used or not
        const standardFeature = await StandardFeatures.findById({ _id: mongoose.Types.ObjectId(post._id) });
        if (standardFeature.featureType !== post.featureType) {
            const checkIfFeatureIsUsed = await PlanFeatures.find({ featureID: mongoose.Types.ObjectId(post._id) });
            if (checkIfFeatureIsUsed.length > 0) {
                let successResponse = genericResponse(false, "Can't change Feature Type! Feature is already in use.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        if (standardFeature.featureStatus === 'Active' && standardFeature.featureStatus !== post.featureStatus) {
            const checkIfFeatureIsUsed = await PlanFeatures.find({ featureID: mongoose.Types.ObjectId(post._id) });
            if (checkIfFeatureIsUsed.length > 0) {
                let successResponse = genericResponse(false, "Can't make the Feature inactive! Feature is already in use.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        const updateStandardFeature = req.body;
        updateStandardFeature.recordType = 'U';
        updateStandardFeature.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: updateStandardFeature }
        const updatedStandardFeature = await StandardFeatures.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
        let successResponse = genericResponse(true, "StandardFeature updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteStandardFeature = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (req.body._id != undefined && req.body._id != '') {
            // Checking if Feature has been used or not
            const checkIfFeatureIsUsed = await PlanFeatures.find({ featureID: mongoose.Types.ObjectId(post._id) });
            if (checkIfFeatureIsUsed.length > 0) {
                let successResponse = genericResponse(false, "Can't delete the Feature! Feature is already in use.", []);
                res.status(201).json(successResponse);
                return;
            }


            const fetchedStandardPlanFeature = await StandardFeatures.find({ _id: req.body._id });
            const standardPlanFeature = fetchedStandardPlanFeature[0];
            if (standardPlanFeature) {
                await standardPlanFeature.remove();
                let successResponse = genericResponse(true, "StandardPlanFeature deleted successfully.", []);
                res.status(200).json(successResponse);
            } else {
                let errorRespnse = genericResponse(false, "StandardPlanFeature not found.", []);
                res.status(200).json(errorRespnse);
            }
        }
        else {
            let errorRespnse = genericResponse(false, "StandardPlanFeature not found.", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchStandardFeatureById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const standardFeature = await StandardFeatures.findById(query);
        let successResponse = genericResponse(true, "StandardFeature fetched successfully.", standardFeature);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});




export {
    addStandardFeature,
    fetchStandardFeatures,
    updateStandardFeature,
    deleteStandardFeature,
    fetchStandardFeatureById,

}