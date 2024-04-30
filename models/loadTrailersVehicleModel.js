import mongoose from 'mongoose';

const loadTrailersSchema = mongoose.Schema(
    {

        loadPlanVehiclesID: {
            type: Array,
        },

        vehicleID: {
            type: mongoose.Schema.Types.ObjectId,
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

const LoadTrailersVehicles = mongoose.model('load_trailers_vehicles', loadTrailersSchema)

export default LoadTrailersVehicles;