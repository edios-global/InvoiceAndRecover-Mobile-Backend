import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const busionessUsersSchema = mongoose.Schema(
    {
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
            required: true,
        },
        companyName: {
            type: String,
        },
        companyPhoneNumber: {
            type: String,
        },
        companyEmailAddress: {
            type: String,
        },
        companyStreetAddress: {
            type: String,
        },
        companyCity: {
            type: String,
        },
        companyZipCode: {
            type: String,
        },
        companyStateId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        companyCountryId: {
            type: mongoose.Schema.Types.ObjectId,
            // required: false
        },
        ccName: {
            type: String,
        },
        ccNumber: {
            type: String,
        },
        ccExpiryDate: {
            type: String,
        },
        ccCVVCode: {
            type: String,
        },
        ccBillingStreetAddress: {
            type: String,
        },
        ccBillingCity: {
            type: String,
        },
        ccBillingZipCode: {
            type: String,
        },
        ccBillingStateId: {
            type: mongoose.Schema.Types.ObjectId,
            // required: true
        },
        ccBillingCountryId: {
            type: mongoose.Schema.Types.ObjectId,
            // required: true
        },
        userRegistrationDate: {
            type: Date,
        },
        businessUserStatus: {
            type: String,
            required: true,
            default: 'New'
        },
        planCancellationReqeustDate: {
            type: Date,
            required: false,
        },
        planCancellationEffectiveDate: {
            type: Date,
            required: false,
        },
        planCancellationNotes: {
            type: String,
        },
        paymentDateTime: {
            type: Date,
        },
        paymentGateway: {
            type: String,
        },
        paymentTransactionId: {
            type: String,
        },
        paymentStatus: {
            type: String,
        },

        // reviewPageBGColor: {
        //     type: String,
        // },
        bgCurrentColor: {
            type: String,
            // default: '#FFFFFF'
        },
        bgPreviousColor: {
            type: String,
            // default: '#FFFFFF'
        },
        showCompanyLogo: {
            type: Number,
            // default: 1
        },
        showCompanyPhoneNumber: {
            type: Number,
            // default: 0
        },
        showCompanyName: {
            type: Number,
            // default: 1
        },

        repeatCustomerFeedback: {
            type: Number,
            // default: 0
        },
        repeatCustomerFeedbackDays: {
            type: Number,
        },
        defaultSendMethod: {
            type: String,
            // default: 'Both'
        },
        feedbackRequestSender: {
            type: String,
        },
        leaveFeedbackUrl: {
            type: String,
        },
        secondPositiveRequestReminderDays: {
            type: Number,
            // default: 10,
        },
        firstPositiveRequestReminderDays: {
            type: Number,
            // default: 5,
        },
        secondReviewRequestReminderDays: {
            type: Number,
            // default: 10,
        },
        firstReviewRequestReminderDays: {
            type: Number,
            // default: 5,
        },
        firstReviewRequestReminder: {
            type: Number,
            // default: 1,
        },
        secondReviewRequestReminder: {
            type: Number,
            // default: 1,
        },
        firstPositiveFeedbackRequestReminder: {
            type: Number,
            // default: 1,
        },
        secondPositiveFeedbackRequestReminder: {
            type: Number,
            // default: 1,
        },
        negativeEmailApology: {
            type: Number,
            default: 0,
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

        smsTemplate: {
            type: String,
        },
        emailTemplateSubject: {
            type: String,
        },
        emailTemplateBody: {
            type: String,
        },
        feedbackPageText: {
            type: String,
        },
        positiveLandingPageText: {
            type: String,
        },
        negativeLandingPageText: {
            type: String,
        },
        negativeApologyEmailSubject: {
            type: String
        },
        negativeApologyEmailBody: {
            type: String
        },
        gatewayUserID: {
            type: String
        },
        verificationType: {
            type: String
        },
        verificationStatus: {
            type: Number
        },
        wizardStatusFlag: {
            type: Number,
            required: true,
            default: 0
        },
        trialUser: {
            type: Number,
            required: true,
            default: 1
        },

        availableCredits: {
            type: Number,
            required: false,
        },
        positiveEmailNotificationSubject: {
            type: String,
        },
        industryType: { type: String, },
        organizationType: { type: String, },
        abnNumber: { type: String, },
        businessName: { type: String, },

        positiveEmailNotificationBody: {
            type: String,
        },
        negativeEmailNotificationSubject: {
            type: String
        },
        negativeEmailNotificationBody: {
            type: String
        },
        negativeLandingPageEnableGoogleReview: {
            type: Number
        },
        firstReviewRequestReminderEmailSubject: {
            type: String
        },
        firstReviewRequestReminderFeedbackPageText: {
            type: String
        },
        secondReviewRequestReminderEmailSubject: {
            type: String
        },
        secondReviewRequestReminderFeedbackPageText: {
            type: String
        },
        firstPositiveFeedbackRequestReminderEmailSubject: {
            type: String
        },
        firstPositiveFeedbackRequestReminderFeedbackPageText: {
            type: String
        },
        secondPositiveFeedbackRequestReminderEmailSubject: {
            type: String
        },
        secondPositiveFeedbackRequestReminderFeedbackPageText: {
            type: String
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
        emailOTP: {
            type: String,
            // required: true,
        },
        mobileOTP: {
            type: String,
            // required: true,
        },
        cancellationType: {
            type: String,
        },
        referralCode: {
            type: String,
        },
        apUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        pushNotificationID: { type: String },
        // customerID: {
        //     type: String,
        //     required: false
        // },
        // subscriptionID: {
        //     type: String,
        //     required: false
        // },
        cardCaptured: {
            type: Number,
            required: false
        },
        recordType: {
            type: String,
            required: true,
            default: 'I',
        },

    }
)
busionessUsersSchema.plugin(paginate);
busionessUsersSchema.plugin(aggregatePaginate);

const BusinessUsers = mongoose.model('business_users', busionessUsersSchema)

export default BusinessUsers;