import mongoose from 'mongoose';

const TrackStatusSchema = mongoose.Schema(
    {

        orderID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        statusDateTime: {
            type: Date,
        },

        trackStatus: {
            type: String,
        },
        createdBy: {
            type: Number,
        },
        createdDate: {
            type: Date,
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
            default: 'I',
        }
    }
)

const TrackStatusLogs = mongoose.model('Track_Status_Logs', TrackStatusSchema)

export default TrackStatusLogs;