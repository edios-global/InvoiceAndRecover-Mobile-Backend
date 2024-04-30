
import mongoose from 'mongoose';
const businessUserCreditsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        transactionDateTime: {
            type: Date,
            required: true,
        },
        transactionDescription: {
            type: String,
            required: true,
        },
        creditsPurchased: {
            type: Number,
            required: true,
        },
        creditsUsed: {
            type: Number,
            required: true,
        },
        creditsBalance: {
            type: Number,
            required: true,
        },
        orderID:{
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        createdBy: {
            type: Number,
            required: false,
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

    })
const BussinessUserCredit = mongoose.model('Business_User_Credits', businessUserCreditsSchema)

export default BussinessUserCredit;



