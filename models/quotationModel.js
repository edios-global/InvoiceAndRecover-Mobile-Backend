import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const quotationsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,

        },
        contactID: {
            type: mongoose.Schema.Types.ObjectId,

        },
        purchaseOrderNumber: {
            type: String,
        },
        quotationNumber: {
            type: String,
        },
        quotationDate: {
            type: Date,

        },
        validUpto: {
            type: String,
        },
        validUptoDate: {
            type: Date,

        },
        quotationStatus: {
            type: String,

        },
        itemID: {
            type: [],

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
        paymentInstructions: {
            type: String,
        },
        description: {
            type: String,
        },
        currencyValue: {
            type: String,
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
quotationsSchema.plugin(paginate);
quotationsSchema.plugin(aggregatePaginate);
const Quotations = mongoose.model('quotations', quotationsSchema)

export default Quotations;