import mongoose from 'mongoose';

const shipSchema = mongoose.Schema(
    {

        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        cargoLength: {
            type: Number,
        },

        cargoBreadth: {
            type: Number,
        },

        cargoHeight: {
            type: Number,
        },

        cargoVolume: {
            type: Number,
        },
        cargoVolumeCharges: {
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

const ShipmentCharge = mongoose.model('Shipment_Charge', shipSchema)

export default ShipmentCharge;