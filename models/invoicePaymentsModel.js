import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoicePaymentsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        invoiceID: {
            type: String,
            required: true,
        },
        invoiceDate: {
            type: Date,
            required: true,
        },
        invoiceStatus: {
            type: String,
            required: true,
        },
        invoiceNumber: {
            type: String,
            required: true,
        },
        transactionType: {
            type: String,
            required: true,
        },
        currencySymbol: {
            type: String,
            required: true,
        },
        invoiceAmount: {
            type: Number,
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
        },
        paymentAmount: {
            type: Number,
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
invoicePaymentsSchema.plugin(paginate);
invoicePaymentsSchema.plugin(aggregatePaginate);
const InvoicePaymentsModel = mongoose.model('invoice_payments', invoicePaymentsSchema)

export default InvoicePaymentsModel;