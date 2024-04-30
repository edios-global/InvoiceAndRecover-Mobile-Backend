import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";


const consignSchema = mongoose.Schema(
    {
        
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId, 
        },
        
        cpcZoneName : {
            type: String,
        },
        
        cpcFromDistance: {
            type: Number,
        },

        cpcToDistance: {
            type: Number,
        },

        cpcPickupCharges: {
            type: Number,
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
consignSchema.plugin(paginate);
consignSchema.plugin(aggregatePaginate);

const ConsignmentPickupCharges = mongoose.model('Consignment_Pickup_Charges', consignSchema)

export default ConsignmentPickupCharges;