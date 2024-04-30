import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const standardFeautresSchema = mongoose.Schema(
    {

        featureName: {
            type: String,
            required: true,
        },
        featureType: {
            type: String,
            required: true,
        },
        featureSequence: {
            type: Number,
            required: true,
        },
        featureCode: {
            type: Number,
            required: true,
        },
        featureStatus: {
            type: String,
            required: true,
        },

        createdBy: {
            type: Number,
            // required: true,
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
standardFeautresSchema.plugin(paginate);
standardFeautresSchema.plugin(aggregatePaginate);
const StandardFeatures = mongoose.model('standard_features', standardFeautresSchema)
export default StandardFeatures;