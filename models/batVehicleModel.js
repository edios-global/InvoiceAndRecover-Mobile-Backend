import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const batVehicleSchema = mongoose.Schema(
    {

        // businessUserID: {
        //     type: mongoose.Schema.Types.ObjectId, 
        // },

        batGroupID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        vehicleCategory: {
            type: mongoose.Schema.Types.ObjectId,
        },

        registrationNumber: {
            type: String,
            // type: mongoose.Schema.Types.ObjectId, 
        },
        vehicleMakeModel: {
            type: String,
        },
        vehicleManufacturingYear: {
            type: String,
        },
        vinChassisNumber: {
            type: String,
        },
        engineNumber: {
            type: String,
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
batVehicleSchema.plugin(paginate);
batVehicleSchema.plugin(aggregatePaginate);
const BATVehicle = mongoose.model('batVehicle_Bfm', batVehicleSchema)

export default BATVehicle;