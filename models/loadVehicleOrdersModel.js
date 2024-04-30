import mongoose from 'mongoose';

const loadVehicleOrderSchema = mongoose.Schema(
    {

        loadPlanVehicleID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        allocationDateTime: {
            type: Date,
        },
        orderItemID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        orderNumber:{
            type: Number,
        },
        barCodeID:{
            type: String,
        },
        orderID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        itemStatus:{
            type: String,
        },
        receivedQty:{
            type: Number,
        },
        orderDropWarehouseID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        slotNumber: {
            type: Number,
        },
        slotCapacity: {
            type: Number,
        },
        loadedVolume: {
            type: Number,
        },
        balanceVolume: {
            type: Number,
        },
        loadedWeight: {
            type: Number,
        },
        orderDetails: {
            type: Object,
        },
        notes:{
            type: String,
        },
        trailerPalletType:{
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
        },

    }
)

const LoadVehicleOrder = mongoose.model('load_Vehicle_Orders', loadVehicleOrderSchema)

export default LoadVehicleOrder;