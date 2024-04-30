import mongoose from 'mongoose';
import express from 'express'
import {
     addStandardFeature,
     deleteStandardFeature,
     fetchStandardFeatureById,
     fetchStandardFeatures,
     updateStandardFeature,
} from '../controllers/subscriptionPlanController/standardPlanFeaturesController.js';

import {
     addSubscriptionPlan,
     fetchSubscriptionPlan,
     updateSubscriptionPlan,
     deleteSubscriptionPlan,
     fetchSubscriptionPlanById,
     fetchRoles,
} from '../controllers/subscriptionPlanController/subscriptionPlanController.js';


import {
     addPlanFeature,
     fetchPlanFeatures,
     updatePlanFeature,
     deletePlanFeature,
     fetchPlanFeatureById,
     fetchPlanNames,
     fetchFeatureNames,
     deletPlanFeatureSlab,
} from '../controllers/subscriptionPlanController/planFeaturesController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()

router.post('/addStandardFeature', verifyToken, addStandardFeature);
router.post('/updateStandardFeature', verifyToken, updateStandardFeature);
router.post('/fetchStandardFeatures', verifyToken, fetchStandardFeatures);
router.post('/deleteStandardFeature', verifyToken, deleteStandardFeature);
router.post('/fetchStandardFeatureById', verifyToken, fetchStandardFeatureById);

router.post('/addSubscriptionPlan', verifyToken, addSubscriptionPlan);
router.post('/fetchSubscriptionPlan', verifyToken, fetchSubscriptionPlan);
router.post('/updateSubscriptionPlan', verifyToken, updateSubscriptionPlan);
router.post('/deleteSubscriptionPlan', verifyToken, deleteSubscriptionPlan);
router.post('/fetchSubscriptionPlanById', verifyToken, fetchSubscriptionPlanById);
router.post('/fetchRoles', verifyToken, fetchRoles);

router.post('/addPlanFeature', verifyToken, addPlanFeature)
router.post('/fetchPlanFeatures', verifyToken, fetchPlanFeatures)
router.post('/updatePlanFeature', verifyToken, updatePlanFeature)
router.post('/deletePlanFeature', verifyToken, deletePlanFeature)
router.post('/fetchPlanFeatureById', verifyToken, fetchPlanFeatureById)
router.post('/fetchPlanNames', verifyToken, fetchPlanNames)
router.post('/fetchFeatureNames', verifyToken, fetchFeatureNames)
router.post('/deletPlanFeatureSlab', verifyToken, deletPlanFeatureSlab)

export default router