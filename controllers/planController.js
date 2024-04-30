import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import SubscriptionPlan from '../models/subscriptionPlansModel.js';

const fetchPlan = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        if (post.planName != undefined && post.planName != '' && post.planPeriod != undefined && post.planPeriod != '') {
            const query = { planName: post.planName, planPeriod: post.planPeriod }
            const fetchPlan = await SubscriptionPlan.find(
                query, { planName: 1, planPeriod: 1, planMonthlyCost: 1, planStatus: 1, planSequence: 1 }
            );
            let successResponse = genericResponse(true, "Data fetched successfully.", fetchPlan);
            res.status(200).json(successResponse);
        }
        else {
            let errorRespnse = genericResponse(false, "SubscriptionPlan/SubscriptionPeriod can't be blank!", []);
            res.status(400).json(errorRespnse)
        }
    }
    catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse)
    }
});

export {
    fetchPlan
}