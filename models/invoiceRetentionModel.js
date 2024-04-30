import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceRetentionPaymentsSchema = mongoose.Schema(
    {

        invoiceID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        retentionDueDate: {
            type: Date,
            required: true,
        },
        retentionStatus: {
            type: String,
            required: true,
        },
        retentionNumber: {
            type: String,
            required: true,
        },
        retentionTransactionID: {
            type: String,
        },
        retentionPaymentAmount: {
            type: Number,
            required: true,
        },
        retentionPaymentDate: {
            type: Date,
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
invoiceRetentionPaymentsSchema.plugin(paginate);
invoiceRetentionPaymentsSchema.plugin(aggregatePaginate);
const InvoiceRetentionPaymentsModel = mongoose.model('invoice_retention_payments', invoiceRetentionPaymentsSchema)

export default InvoiceRetentionPaymentsModel;