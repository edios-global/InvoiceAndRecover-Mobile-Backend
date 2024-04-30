import mongoose from 'mongoose';

const businessReviewLinkSchema = mongoose.Schema(
    {
        businessLocationID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        reviewSiteName: {
            type: String,
            required: true,
        },
        reviewSiteLink: {
            type: String,
            required: false,
        },
        askForReviews: {
            type: Number,
            required: false,
            default: 0
        },
        monitorOnlineReviews: {
            type: Number,
            required: false,
            default:0
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
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
        reviewSiteID: {
            type: String,
        },
        reviewBusinessName: {
            type: String,
        },
        reviewBusinessAddress: {
            type: String,
        },
        reviewSiteSequence: {
            type: Number,
        }
    })
const businessReviewLink = mongoose.model('business_review_links', businessReviewLinkSchema)

export default businessReviewLink;