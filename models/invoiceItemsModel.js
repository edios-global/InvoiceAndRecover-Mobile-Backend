import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceItemsSchema = mongoose.Schema(
    {
        invoiceID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        itemID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        itemName: {
            type: String,
        },
        itemPrice: {
            type: Number,
        },
        itemQuantity: {
            type: Number,
        },
        gst: {
            type: Number,
        },
        priceValidity: {
            type: String,
        },
        priceValidityValue: {
            type: Number,
        },
        discountType: {
            type: String,
        },
        discountValue: {
            type: Number,
        },
        discountAmount: {
            type: Number,
        },
        createdDate: {
            type: Date,
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
invoiceItemsSchema.plugin(paginate);
invoiceItemsSchema.plugin(aggregatePaginate);
const InvoiceItems = mongoose.model('invoiceItems', invoiceItemsSchema)

export default InvoiceItems;