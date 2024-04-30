import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionPlanSchema = mongoose.Schema(
    {
        planName: {
            type: String,
            required: true,
        },
        planSequence: {
            type: Number,
            required: true,
        },
        planCode: {
            type: String,
            required: true,
        },
        planMonthlyCost: {
            type: Number,
            required: true,
        },

        planStatus: {
            type: String,
            required: true,
            default: "Active"
        },
        associatedRoleID: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
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
subscriptionPlanSchema.plugin(paginate);
subscriptionPlanSchema.plugin(aggregatePaginate);
const SubscriptionPlan = mongoose.model('subscription_plans', subscriptionPlanSchema)
export default SubscriptionPlan;