import mongoose from 'mongoose';

const loadTrailerDropWarehouseSchema = mongoose.Schema(
    {

       
        loadPlanVehiclesID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        dropWarehouseID : {
            type: mongoose.Schema.Types.ObjectId,
        },
        trailerStatus:{
            type:String
        },
        createdDate: {
            type: Date,
        },
        lastModifiedDate: {
            type: Date,
        },
        recordType: {
            type: String,
        },

    }
)

const LoadTrailerDropWarehouse = mongoose.model('load_trailer_dropWarehouses', loadTrailerDropWarehouseSchema)

export default LoadTrailerDropWarehouse;