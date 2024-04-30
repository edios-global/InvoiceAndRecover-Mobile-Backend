import mongoose from 'mongoose';

const businessUserPlanFeaturesSchema = mongoose.Schema(
    {
        businessUserPlanID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        planFeatureID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        featureCount: {
            type: Number,
        },
        selectionBasedValue: {
            type: String,
        },
        // fromSlabValue: {
        //     type: Number,
        // },
        // toSlabValue: {
        //     type: Number,
        // },
        // slabRate: {
        //     type: Number,
        // },
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
const BusinessUserPlanFeatures = mongoose.model('business_user_plan_features', businessUserPlanFeaturesSchema)
export default BusinessUserPlanFeatures;