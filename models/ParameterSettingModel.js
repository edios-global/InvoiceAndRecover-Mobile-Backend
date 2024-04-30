import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const parameterSettingSchema = mongoose.Schema(
    {
        parameterName: {
            type: String,
            required: true,
        },
        parameterCode: {
            type: String,
            required: true,
        },
        parameterType: {
            type: String,
            required: true,
        },
        parameterLength: {
            type: Number,
            required: true,
        },
        parameterValue: {
            type: String,
            required: true,
        },
        parameterStatus: {
            type: String,
            required: true,
        },
        parameterInstructions: {
            type: String,
            required: false,
        }
        ,
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
parameterSettingSchema.plugin(paginate);
parameterSettingSchema.plugin(aggregatePaginate);
const parameterSettings = mongoose.model('parameter_Setting', parameterSettingSchema)

export default parameterSettings;