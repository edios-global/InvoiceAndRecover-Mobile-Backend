import mongoose from 'mongoose';

const buPaymentTransactionsSchema = mongoose.Schema(
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
        paymentTransactionID:{
            type: String,
        },
        paymentGatewayIntentID:{
            type: String,
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
const BuPaymentTransactionsModel = mongoose.model('bu_payment_transactions', buPaymentTransactionsSchema)
export default BuPaymentTransactionsModel;