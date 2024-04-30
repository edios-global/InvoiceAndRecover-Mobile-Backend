import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const batGroupSchema = mongoose.Schema(
    {

        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        batGroupName: {
            type: String,
        },

        tareWeight: {
            type: String,
        },

        temperatureType: {
            type: String,
        },

        batGroupStatus: {
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
batGroupSchema.plugin(paginate);
batGroupSchema.plugin(aggregatePaginate);

const BATGroup = mongoose.model('batGroup', batGroupSchema)

export default BATGroup;