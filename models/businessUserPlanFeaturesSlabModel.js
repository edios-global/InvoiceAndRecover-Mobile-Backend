import mongoose from 'mongoose';

const businessUserPlanFeautresSlabSchema = mongoose.Schema(
    {
        businessUserPlanFeatureID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        fromSlabValue: {
            type: Number,
            required: true,
        },
        toSlabValue: {
            type: Number,
            required: true,
        },
        slabRate: {
            type: Number,
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
const BusinessUserPlanFeatureSlabs = mongoose.model('business_user_plan_feature_slabs', businessUserPlanFeautresSlabSchema)
export default BusinessUserPlanFeatureSlabs;