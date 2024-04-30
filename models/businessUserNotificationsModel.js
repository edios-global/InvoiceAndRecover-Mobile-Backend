import mongoose from 'mongoose';
const businessUserNotificationSchema = mongoose.Schema({

    firstPartyReviewNotificationType:{
        type:String,
    },
    thirdPartyReviewNotificationType:{
        type:String,
    },    
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
    },
    businessUserID:{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
    },
    createdBy: {
        type: Number,
    },
    createdDate: {
        type: Date,
        required: true,
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
})
const businessUserNotification =mongoose.model('business_user_notifications',businessUserNotificationSchema);
export default businessUserNotification;