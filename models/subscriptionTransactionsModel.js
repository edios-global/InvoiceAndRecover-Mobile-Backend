import mongoose from 'mongoose';

const subscriptionTransactionsSchema = mongoose.Schema(
    {
        transactionDateTime: {
            type: Date,
            required: true,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        transactionType: {
            type: String,
            required: true,
        },
        transactionStatus: {
            type: String,
            required: true,
        },
        oldBusinessUserPlanID: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        newBusinessUserPlanID: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        transactionNotes: {
            type: String,
        },
        createdDate: {
            type: Date,
            required: true,
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
const SubscriptionTransactionsModel = mongoose.model('subscription_transactions', subscriptionTransactionsSchema)
export default SubscriptionTransactionsModel;