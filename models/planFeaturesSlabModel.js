import mongoose from 'mongoose';

const planFeautresSlabSchema = mongoose.Schema(
    {
        planFeatureID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        fromSlabValue: {
            type: Number,
        },
        toSlabValue: {
            type: Number,
        },
        slabRate: {
            type: Number,
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
const PlanFeaturesSlab = mongoose.model('plan_features_slabs', planFeautresSlabSchema)
export default PlanFeaturesSlab;