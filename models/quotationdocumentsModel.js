import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const quotationDocumentsSchema = mongoose.Schema(
    {
        quotationID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        documentName: {
            type: String,
        },
        documentFileName: {
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
quotationDocumentsSchema.plugin(paginate);
quotationDocumentsSchema.plugin(aggregatePaginate);
const QuotationDocuments = mongoose.model('quotationDocuments', quotationDocumentsSchema)

export default QuotationDocuments;