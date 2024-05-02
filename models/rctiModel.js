import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const RCTISchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        supplierID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        purchaseOrderNumber: {
            type: String,
        },
        rctiNumber: {
            type: String,
        },
        rctiSequenceNumber: {
            type: String,
        },
        rctiDate: {
            type: Date,
            required: true,
        },
        dueUpto: {
            type: String,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        rctiStatus: {
            type: String,
            required: true
        },
        currencyValue: {
            type: String,
        },
        gstType: {
            type: String,
        },
        totalAmount: {
            type: Number,
        },
        totalDiscountAmount: {
            type: Number,
        },
        finalAmount: {
            type: Number,
        },
        paymentInstruction: {
            type: String,
        },
        paymentMode: {
            type: String,
        },
        paymentTransactionID: {
            type: String,
        },
        paymentAmount: {
            type: String,
        },
        paymentDate: {
            type: Date,
        },
        createdDate: {
            type: Date,
            required: true,

        },
        lastModifiedDate: {
            type: Date,
        },
        recordType: {
            type: String,
            required: true,
            default: 'I',
        },

    }
)
RCTISchema.plugin(paginate);
RCTISchema.plugin(aggregatePaginate);
const RCTI = mongoose.model('rcti', RCTISchema)

export default RCTI;