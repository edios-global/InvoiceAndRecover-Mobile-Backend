import mongoose from 'mongoose';

const ReviewRequestsTempdataSchema = mongoose.Schema(
    {
        phoneNumber: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        emailAddress: {
            type: String,
        },
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        businessLocationID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        uploadDateTime: {
            type: Date
        },
        requestStatus: {
            type: String
        },
        communicationType: {
            type: String
        },
        notes: {
            type: String,
        },
        jobID: {
            type: String,
        },
        customerID: {
            type: String,
        }
    })
const ReviewRequestsTempdata = mongoose.model('review_requests_tempdatas', ReviewRequestsTempdataSchema)

export default ReviewRequestsTempdata;