import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const legalDocumentFormatsSchema = mongoose.Schema(
    {


        documentName: {
            type: String,
            required: true,
        },
        documentRemark: {
            type: String,
        },
        documentFileName: {
            type: String,
            required: true,
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
legalDocumentFormatsSchema.plugin(paginate);
legalDocumentFormatsSchema.plugin(aggregatePaginate);
const LegalDocumentFormats = mongoose.model('legal_document_formats', legalDocumentFormatsSchema)

export default LegalDocumentFormats;