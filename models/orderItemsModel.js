import mongoose from 'mongoose';

const orderItemSchema = mongoose.Schema(
    {

        orderID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        numberOfItems: {
            type: Number,
        },

        cargoType: {
            type: String,
        },

        cargoTemperature: {
            type: String,
        },

        description: {
            type: String,
        },
        itemDescription: {
            type: String,
        },
        weightInKg: {
            type: Number,
            // min: 0.1,
            // max: 100.0,
        },
        itemStatus:{
            type: String,
            default:"Pending"
        },
        receivedQty:{
            type: Number,
        },
        lengthInMm: {
            type: Number,
        },
        breadthInMm: {
            type: Number,
        },
        heightInMm: {
            type: Number,
        },
        barCodeID:{
            type: String,
        },
        itemVariableCharge:{
            type: Number,
        },
        notes:{
            type: String,
        },
        createdBy: {
            type: Number,
        },
        createdDate: {
            type: Date,
            // required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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

const OrderItems = mongoose.model('Order_Item', orderItemSchema)

export default OrderItems;