import mongoose from 'mongoose';

const subscriptionPlanCostSchema = mongoose.Schema(
    {

        planID: {
            type: String,
            required: true,
        },
        planPeriod: {
            type: String,
            required: true,
        },
        planCost: {
            type: Number,
            required: true,
        },
        recurringBilling: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Number,
            // required: true,
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),

        },
        lastModifiedDate: {
            type: Date,
        },
        lastModifiedBy: {
            type: Number,
        },
        recordType: {
            type: String,
            required: true,
            default: 'I',
        }
    }
)
const SubscriptionPlanCost = mongoose.model('subscription_plan_cost', subscriptionPlanCostSchema)
export default SubscriptionPlanCost;