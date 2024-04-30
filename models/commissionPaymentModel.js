import mongoose from 'mongoose';

const commissionPaymentSchema = mongoose.Schema(
    {
       
        paymentDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        paymentAmount: {
            type: Number,
            required: true,
        
        },
        paymentMode: {
            type: String,
            required: true,
        },
        paymentTransactionID: {
            type: String,
            require:true,
        },
    
        createdBy: {
            type: Number,
            required: false,
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
const CommissionPayment = mongoose.model('Commission_Payments', commissionPaymentSchema)
export default CommissionPayment;