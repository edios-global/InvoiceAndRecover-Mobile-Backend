import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        contactID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        quotationID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        purchaseOrderNumber: {
            type: String,
        },
        invoiceNumber: {
            type: String,
        },
        invoiceSequenceNumber: {
            type: String,
        },
        invoiceType: {
            type: String,
        },
        invoiceStatus: {
            type: String,
        },
        invoiceDate: {
            type: Date,
        },
        dueUpto: {
            type: String,
        },
        dueDate: {
            type: Date,
        },
        gstType: {
            type: String,
        },
        currencyValue: {
            type: String,
        },
        totalAmount: {
            type: Number,
        },
        totalDiscountAmount: {
            type: String,

        },
        finalAmount: {
            type: Number,

        },
        paymentInstructions: {
            type: String,

        },
        payablePendingAmount: { type: Number },

        invoicePayment: [{
            paymentMode: {
                type: String,
            },
            paymentType: {
                type: String,
            },
            paymentTransactionID: {
                type: String,
            },
            paymentAmount: {
                type: Number,
            },
            pendingAmount: { type: Number },
            paymentDate: {
                type: Date,
            },
        }],
        scheduleRetention: {
            type: Boolean,
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
        recordType: {
            type: String,
            required: true,
            default: 'I',
        }

    })
invoiceSchema.plugin(paginate);
invoiceSchema.plugin(aggregatePaginate);
const InvoiceModel = mongoose.model('invoice', invoiceSchema)

export default InvoiceModel;