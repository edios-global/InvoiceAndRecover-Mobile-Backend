import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";


const itemsSchema = mongoose.Schema(
    {
        categoryID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        itemName: {
            type: String,
            required: true,
        },
        itemCode: {
            type: Number, required: true,
        },
        itemDescription: {
            type: String,
        },

        unitOfMeasurement: {
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
            default: "None"
        },
        priceValidityValue: {
            type: Number,
            default: 0
        },
        discountType: {
            type: String,
            default: "None"
        },
        discountValue: {
            type: Number,
            default: 0
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
itemsSchema.plugin(paginate);
itemsSchema.plugin(aggregatePaginate);
const items = mongoose.model('items', itemsSchema)

export default items;