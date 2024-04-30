import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const planFeautresSchema = mongoose.Schema(
    {
        planID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        featureID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        featureType: {
            type: String,
        },
        featureCount: {
            type: Number,
        },
        selectionBasedValue: {
            type: String,
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
planFeautresSchema.plugin(paginate);
planFeautresSchema.plugin(aggregatePaginate);
const PlanFeatures = mongoose.model('plan_features', planFeautresSchema)
export default PlanFeatures;