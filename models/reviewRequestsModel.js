import mongoose from 'mongoose';

const requestReviewSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        businessLocationID: {
            type: mongoose.Schema.Types.ObjectId,
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
            required: false,
        },
        emailAddress: {
            type: String,
            required: false,
        },
        communicationType: {
            type: String,
            required: true,
        },
        requestSource: {
            type: String,
            required: true,
        },
        responseRating: {
            type: Number,
        },
        sentDateTime: {
            type: Date,
        },
        requestDateTime: {
            type: Date,
        },
        responseDateTime: {
            type: Date,
        },
        firstRequestReminderDateTime: {
            type: Date,
        },
        secondRequestReminderDateTime: {
            type: Date,
        },
        firstPositiveReminderDateTime: {
            type: Date,
        },
        secondPositiveReminderDateTime: {
            type: Date,
        },
        negativeApologyEmailSentDateTime: {
            type: Date,
        },
        requestStatus: {
            type: String,
        },
        responseFeedback: {
            type: String,
        },
        createdBy: {
            type: Number,
            required: false,
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
        },
        responseRatingType: {
            type: String,
        },
        jobID: {
            type: String,
        },
        customerID: {
            type: String,
        }
    })
const ReviewRequest = mongoose.model('reviewRequests', requestReviewSchema)

export default ReviewRequest;