import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const quotationItemsSchema = mongoose.Schema(
    {
        quotationID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        itemID: {
            type: mongoose.Schema.Types.ObjectId,
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
quotationItemsSchema.plugin(paginate);
quotationItemsSchema.plugin(aggregatePaginate);
const QuotationItems = mongoose.model('quotationItems', quotationItemsSchema)

export default QuotationItems;