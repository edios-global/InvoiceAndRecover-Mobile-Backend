import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const rctiItemsSchema = mongoose.Schema(
    {
        rctiID: {
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
rctiItemsSchema.plugin(paginate);
rctiItemsSchema.plugin(aggregatePaginate);
const RCTI_Items = mongoose.model('rcti_items', rctiItemsSchema)

export default RCTI_Items;