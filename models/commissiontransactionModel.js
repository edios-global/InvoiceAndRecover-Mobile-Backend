import mongoose from 'mongoose'
const commissionTransactionSchema = mongoose.Schema(
    {

        transactionDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        apUserID : {
            type: mongoose.Schema.Types.ObjectId,
           
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        commissionPaymentID: {
            type: mongoose.Schema.Types.ObjectId,
         
        },
        subscriptionAmount: {
            type: Number,
            required: true,

        },
        commissionPercentage: {
            type: Number,
            required: true,
        },
        commissionLumpsum: {
            type: Number,
            required: true,
        },
        commissionAmount: {
            type: Number,
            required: true,
        },
        commissionDescription: {
            type: String,
            required: true,
        },
        commissionStatus: {
            type: String,
            required: false,
        },
        approvalRejectionDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        rejectionNotes: {
            type: String,
            required: false,
            default: 'I',
        },
        createdBy: {
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
        }, 
        paymentFlag:{
            type: Number,
            required: true,
            default : 0

        }

    }
)

const CommissionTransaction = mongoose.model('Program_Commissions', commissionTransactionSchema)

export default CommissionTransaction

