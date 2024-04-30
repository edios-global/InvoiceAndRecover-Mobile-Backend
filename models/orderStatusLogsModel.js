import mongoose from 'mongoose';

const OrderStatusSchema = mongoose.Schema(
    {

        orderID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        assignedDriverID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        statusDateTime: {
            type: Date,
        },
        orderStatus: {
            type: String,
        },
        statusNotes: {
            type: String,
        },
        orderDriverJobID: {
            type: mongoose.Schema.Types.ObjectId,
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

const OrderStatusLogs = mongoose.model('Order_Status_Logs', OrderStatusSchema)

export default OrderStatusLogs;