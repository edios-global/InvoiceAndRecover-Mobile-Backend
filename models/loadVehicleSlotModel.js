import mongoose from 'mongoose';

const loadVehicleSlotSchema = mongoose.Schema(
    {

        loadPlanVehicleID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        slotNumber: {
            type: Number,
        },
        slotCapacity: {
            type: Number,
        },
        
        loadVehicleOrderID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        loadedVolume: {
            type: Number,
        },
        loadedWeight: {
            type: Number,
        },
        balanceVolume:{
            type: Number,
        },
        trailerPalletType:{
            type: String,
            require:true
        },
        createdDate: {
            type: Date,
            require:true
        },
        lastModifiedDate: {
            type: Date,
        },
        recordType: {
            type: String,
        },

    }
)

const LoadVehicleSlot = mongoose.model('load_Vehicle_Slots', loadVehicleSlotSchema)

export default LoadVehicleSlot;