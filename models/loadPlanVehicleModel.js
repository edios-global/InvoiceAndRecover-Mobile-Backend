import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const loadPlanVehiclesSchema = mongoose.Schema(
    {

        vehicleID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        shippingType: {
            type: String,
        },

        registrationNumber: {
            type: String,
        },
        vehicleType: {
            type: String,
        },
        warehouseID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        vehicleCategory: {
            type: String,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        dropLocation: {
            type: String,
        },
        maximumWeight: {
            type: String,
        },
        maximumVolume: {
            type: String,
        },
        shippingVehicleStatus: {
            type: String,
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
        vehicleStatus: {
            type: String,
        },
    }
)
loadPlanVehiclesSchema.plugin(paginate);
loadPlanVehiclesSchema.plugin(aggregatePaginate);
const LoadPlanVehicles = mongoose.model('Load_Plan_Vehicles', loadPlanVehiclesSchema)

export default LoadPlanVehicles;