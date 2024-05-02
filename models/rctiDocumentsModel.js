import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const rctiDocumentsSchema = mongoose.Schema(
    {
        rctiID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        documentName: {
            type: String,
        },
        documentFileName: {
            type: String,
        },
        referenceFolder: {
            type: String,
        },
        uploadedDateTime: {
            type: Date,
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
rctiDocumentsSchema.plugin(paginate);
rctiDocumentsSchema.plugin(aggregatePaginate);
const RCTI_Documents = mongoose.model('rcti_documents', rctiDocumentsSchema)

export default RCTI_Documents;