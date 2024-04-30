import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const vehicleSchema = mongoose.Schema(
    {
      
        businessUserID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        vehicleCategory : {
            type: mongoose.Schema.Types.ObjectId,

        },
        
        registrationNumber : {
            type: String,
        },

        vehicleMakeModel: {
            type: String,
        },

        vehicleOwner: {
            type: String,
        },
        vehicleManufacturingYear: {
            type: String,
        },
        vinChassisNumber : {
            type: String,
        },
        engineNumber : {
            type: String,
        },
        equipmentID: {
            type: String,
        },
        vehicleType : {
            type: String,
        },
        tareWeight: {
            type: String,
        },
        gcm : {
            type: String,
        },
        temperatureType : {
            type: String,
        },
        location: {
            type: String,
        },
        registrationExpiryDate: {
            type: Date,
        },
        vehicleStatus : {
            type: String,
        },
        trailerType  : {
            type: String,
        },
        belowPalletCount : {
            type: String,
        },
        upperPalletCount : {
            type: String,
        },
        palletCount : {
            type: Number,
        },
        slotHeight : {
            type: Number,
        },
        slotBreadth : {
            type: Number,
        },
        slotLength : {
            type: Number,
        },
        mezzHeight:{
            type: Number,
        },
        maxWeight:{
            type: Number,
        },
        maxVolume:{
            type: Number,
        },
        mezzPalletCount:{
            type: Number,
        },
        notes: {
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
vehicleSchema.plugin(paginate);
vehicleSchema.plugin(aggregatePaginate);

const Vehicle = mongoose.model('vehicles', vehicleSchema)

export default Vehicle;