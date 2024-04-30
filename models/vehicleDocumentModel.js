import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const VehicleDocumentSchema = mongoose.Schema(
    {
      
        documentName: {
            type: String,
          
        },
        vehicleID: {
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
VehicleDocumentSchema.plugin(paginate);
VehicleDocumentSchema.plugin(aggregatePaginate);
const VehicleDocument = mongoose.model('vehicle_Document', VehicleDocumentSchema)

export default VehicleDocument;