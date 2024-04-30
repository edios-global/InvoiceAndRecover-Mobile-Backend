import mongoose from 'mongoose';

const businessUserPlansSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        planID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        planActivationDate: {
            type: Date,
            required: true,
        },
        planExpiryDate: {
            type: Date,
            required: false,
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
const BusinessUserPlans = mongoose.model('business_user_plans', businessUserPlansSchema)
export default BusinessUserPlans;