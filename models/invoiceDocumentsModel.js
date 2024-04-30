import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceDocumentsSchema = mongoose.Schema(
    {
        invoiceID: {
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
invoiceDocumentsSchema.plugin(paginate);
invoiceDocumentsSchema.plugin(aggregatePaginate);
const InvoiceDocuments = mongoose.model('invoiceDocuments', invoiceDocumentsSchema)

export default InvoiceDocuments;