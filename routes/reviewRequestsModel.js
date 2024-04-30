import mongoose from 'mongoose';

const requestReviewSchema = mongoose.Schema(
  { 
    businessUserID:{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
    },
    businessLocationID:{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    emailAddress: {
        type: String,
        required: true,
    },
    communicationType: {
        type: String,
        required: true,
    },
    requestSource: {
        type: String,
        required: true,
    },
    responseRating:{
        type:Number,
    },
    requestSentDateTime:{
        type:Date,
    },
    responseDateTime:{
        type:Date,
    },
    createdBy: {
        type: Number,
        required: true,
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
const ReviewRequest = mongoose.model('reviewRequests', requestReviewSchema)

export default ReviewRequest;