import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const deliverySchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        fromDistance: {
            type: Number,
        },
        toDistance: {
            type: Number,
        },
        deliveryTime: {
            type: String,
        },
        createdBy: {
            type: Number,
        },
        createdDate: {
            type: Date,
            required: true,
            // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
deliverySchema.plugin(paginate);
deliverySchema.plugin(aggregatePaginate);

const DeliveryTime = mongoose.model('delivery_time', deliverySchema)

export default DeliveryTime;