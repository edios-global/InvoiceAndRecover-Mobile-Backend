import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const documentSchema = mongoose.Schema(
    {
      
        documentName: {
            type: String,
          
        },
        employeeID: {
            type: mongoose.Schema.Types.ObjectId, 
        },
        
        documentType: {
            type: String,
            
        },
        documentFileName: {
            type: String,
        },
        uploadedDate: {
            type: Date,
            // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
documentSchema.plugin(paginate);
documentSchema.plugin(aggregatePaginate);

const Document = mongoose.model('employee_Documents', documentSchema)

export default Document;