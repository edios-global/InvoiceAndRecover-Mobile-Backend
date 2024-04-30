import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
    {

        notificationID: {
            type: Number,
        },

        userID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        jobID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        shortText: {
            type: String,
        },

        longText: {
            type: String,
        },
        notificationStatus: {
            type: String,
        },
        sentDateTime: {
            type: Date,
        },
        readDateTime: {
            type: Date,
        },

        isSelected: {
            type: Boolean,
        },

        createdBy: {
            type: Number,
        },
        createdDate: {
            type: Date,
            // required: true,
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

const NotificationsModel = mongoose.model('notifications', notificationSchema)

export default NotificationsModel;