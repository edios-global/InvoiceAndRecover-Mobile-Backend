import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const parameterSchema = mongoose.Schema(
    {
        parameterName: {
            type: String,
            required: true,
        },
        parameterCode: {
            type: String,
            required: true,
        },
        parameterStatus: {
            type: String,
            required: true,
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
parameterSchema.plugin(paginate);
parameterSchema.plugin(aggregatePaginate);
const Parameter = mongoose.model('parameters', parameterSchema)

export default Parameter;