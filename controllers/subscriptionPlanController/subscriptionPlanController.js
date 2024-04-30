import asyncHandler from 'express-async-handler'
import SubscriptionPlan from '../../models/subscriptionPlansModel.js';
import genericResponse from '../../routes/genericWebResponses.js';
import { generateSearchParameterList } from '../../routes/genericMethods.js';
import mongoose from 'mongoose';
import Roles from '../../models/rolesModel.js';
import BusinessUserPlans from '../../models/businessUserPlansModel.js';


const addSubscriptionPlan = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("post", post)
        const checkIfSubscriptionPlanAlredyExist = await SubscriptionPlan.find({
            planName: { '$regex': req.body.planName, '$options': 'i' }
        });

        if (checkIfSubscriptionPlanAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Plan Name already exists.", []);
            res.status(201).json(successResponse);
            return;
        }

        const checkIfSubscriptionPlanCodeAlredyExist = await SubscriptionPlan.find({
            planCode: { '$regex': req.body.planCode, '$options': 'i' }
        });

        if (checkIfSubscriptionPlanCodeAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Plan Code already exists.", []);
            res.status(201).json(successResponse);
            return;
        }

        var planSequenceQuery = { planSequence: post.planSequence };
        const checkIfPlanSequenceAlredyExist = await SubscriptionPlan.find(planSequenceQuery);
        if (checkIfPlanSequenceAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Plan Sequence already exists", []);
            res.status(201).json(successResponse);
            return;
        }

        // const lastPlanCode = await SubscriptionPlan.find({}, { planCode: 1 }).sort({ planCode: -1 }).limit(1);

        // if (lastPlanCode.length == 0 || lastPlanCode[0].planCode == undefined)
        //     req.body.planCode = 1
        // else
        //     req.body.planCode = lastPlanCode[0].planCode + 1


        const addedSubscriptionPlan = await new SubscriptionPlan(req.body).save();
        let successResponse = genericResponse(true, "SubscriptionPlan added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchSubscriptionPlan = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {};
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);


        const fetchQuery = [
            {
                $project: {
                    planName: "$planName",
                    planCode: "$planCode",
                    planSequence: "$planSequence",
                    planStatus: "$planStatus",
                    planMonthlyCost: "$planMonthlyCost",
                    planSequenceString: "$planSequenceString",
                    planMonthlyCostString: "$planMonthlyCostString",
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
        if (post.planStatus !== "All") {
            query.planStatus = post.planStatus;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = SubscriptionPlan.aggregate()
        myAggregation._pipeline = fetchQuery
        SubscriptionPlan.aggregatePaginate(
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

const updateSubscriptionPlan = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, planName: { '$regex': '^' + req.body.planName.trim() + '$', '$options': 'i' } };
        const checkIfPlanNameAlredyExist = await SubscriptionPlan.find(query);
        if (checkIfPlanNameAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Plan Name Already Exist", []);
            res.status(201).json(successResponse);
            return;
        }
        var planSequenceQuery = { _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, planSequence: post.planSequence };
        const checkIfPlanSequenceAlredyExist = await SubscriptionPlan.find(planSequenceQuery);
        if (checkIfPlanSequenceAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Plan Sequence already exist", []);
            res.status(201).json(successResponse);
            return;
        }

        const updateSubscriptionPlan = req.body;
        updateSubscriptionPlan.recordType = 'U';
        updateSubscriptionPlan.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: updateSubscriptionPlan }
        const updatedSubscriptionPlan = await SubscriptionPlan.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
        let successResponse = genericResponse(true, "SubscriptionPlan updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteSubscriptionPlan = asyncHandler(async (req, res) => {
    try {
        var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));


        if (req.body._id != undefined && req.body._id != '') {

            // Checking weather Subscription Plan is in use or not
            const checkIfPlanIsUsed = await BusinessUserPlans.find({
                planID: { $in: (req.body._id) },
                planExpiryDate: { $gt: currentDate }
            });

            if (checkIfPlanIsUsed.length > 0) {
                let successResponse = genericResponse(false, "Subscription Plan can't be deleted as it is already in use", []);
                res.status(201).json(successResponse);
                return;
            }

            const fetchedSubscriptionPlan = await SubscriptionPlan.find({ _id: { $in: req.body._id } });
            const standardPlanFeature = fetchedSubscriptionPlan[0];
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

const fetchSubscriptionPlanById = asyncHandler(async (req, res) => {
    try {
        var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        var standardFeature = await SubscriptionPlan.findById(query);
        standardFeature = standardFeature.toObject();
        standardFeature.inUse = false;

        // Checking weather Subscription Plan is in use or not
        const checkIfPlanIsUsed = await BusinessUserPlans.find(
            { planID: mongoose.Types.ObjectId(req.body._id), planExpiryDate: { $gt: currentDate } }
        );
        if (checkIfPlanIsUsed.length > 0)
            standardFeature.inUse = true;

        let successResponse = genericResponse(true, "SubscriptionPlan fetched successfully.", standardFeature);
        res.status(201).json(successResponse);
    } catch (error) {
        console.log("Catch in fetchSubscriptionPlanById ::", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchRoles = asyncHandler(async (req, res) => {
    try {

        const fetchRoles = await Roles.find({ applicableForBusinessUser: "Yes" }).sort({ roleName: 1 });
        let successResponse = genericResponse(true, "Roles fetched successfully.", fetchRoles);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchRoles  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


export {
    addSubscriptionPlan, fetchSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan, fetchSubscriptionPlanById, fetchRoles,
}