import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const cargoSchema = mongoose.Schema(
    {
      
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId, 
        },
        
        cwcZoneName : {
            type: String,
        },
        
        cwcFromDistance: {
            type: Number,
        },

        cwcToDistance: {
            type: Number,
        },

        cwcCargoWeightCharges: {
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
cargoSchema.plugin(paginate);
cargoSchema.plugin(aggregatePaginate);

const CargoWeightCharges = mongoose.model('Cargo_Weight_Charges', cargoSchema)

export default CargoWeightCharges;