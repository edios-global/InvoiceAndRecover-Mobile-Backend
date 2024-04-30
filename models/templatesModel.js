import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const templatesSchema = mongoose.Schema(
    {
        templateName: {
            type: String,
            required: true,
        },
        templateType: {
            type: String,
            required: true,
        },
        templateStatus: {
            type: String,
            required: true,
            default: "Active"
        },
        templateSubject: {
            type: String,
            required: false,
        },
        templateMessage: {
            type: String,
            required: true,
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
templatesSchema.plugin(paginate);
templatesSchema.plugin(aggregatePaginate);
const Templates = mongoose.model('templates', templatesSchema)
export default Templates;