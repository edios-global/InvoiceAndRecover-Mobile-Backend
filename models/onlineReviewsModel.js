import mongoose from 'mongoose';

const onlineReviewSchema = mongoose.Schema(
    {

        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        businessLocationID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        profilePictureFileName: {
            type: String,
            required: false,
        },
        businessReviewLinkID: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        reviewID: {
            type: String,
            required: false,
        },
        reviewURL: {
            type: String,
            required: false,
        },
        customerProfileID: {
            type: String,
            required: false,
        },
        customerProfileURL: {
            type: String,
            required: false,
        },

        reviewWebsite: {
            type: String,
            required: false,
        },
        responseDateTime: {
            type: Date,
            required: false,
        },
        responseRating: {
            type: Number,
            required: false,
        },
        responseFeedback: {
            type: String,
            required: false,
        },
        createdBy: {
            type: Number,
            required: false,
        },
        createdDate: {
            type: Date,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
const OnlineReview = mongoose.model('online_reviews', onlineReviewSchema)

export default OnlineReview;