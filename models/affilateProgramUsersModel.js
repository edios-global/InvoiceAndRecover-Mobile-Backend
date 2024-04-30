import mongoose from 'mongoose';

const affiliateUsersSchema = mongoose.Schema(
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
        streetAddress: {
            type: String,
            required: true,
        },
        companyName: {
            type: String,
            required: false,
        },
        city: {
            type: String,
            required: true,
        },
        profilePictureFileName: {
            type: String,
            required: false,

        },

        emailOTP: {
            type: String,
            required: false,

        },
        mobileOTP: {
            type: String,
            required: false,
        },
        referralCode: {
            type: String,
            required: true,
        },
        profilePictureFileName: {
            type: String,
        },

        zipCode: {
            type: String,
            required: true,
        },
        stateId: {
            type: mongoose.Schema.Types.ObjectId
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId
        },
        userPassword: {
            type: String,
            required: false,
        },
        userRegistrationDate: {
            type: String,
            required: false,
        },
        userStatus: {
            type: String,
            required: false,
            default: "Pending"
        },

        reviewDateTime: {
            type: String,
            required: false,
        },
        commissionPeriod: {
            type: String,
            required: false,
        },
        commissionType: {
            type: String,
            required: false,
        },
        commissionValue: {
            type: String,
            required: false,
        },
        commisionPercentage: {
            type: Number,
            required: false,
        },
        commissionAmount: {
            type: Number,
            required: false,
        },
        commissionLumpsum: {
            type: Number,
            required: false,
        },
        otpVerified: {
            type: Number,
            required: true,
            default: 0
        },
        activationDate: {
            type: Date,
            required: false,
        },
        firstTimeUser: {
            type: Number,
            require: true,
        },
        bankName: {
            type: String,
            required: false,
        },
        accountHolderName: {
            type: String,
            required: false,
        },
        bankCode: {
            type: String,
            required: false,
        },
        accountType: {
            type: String,
            required: false,
        },
        accountNumber: {
            type: String,
            required: false,
        },
        branchAddress: {
            type: String,
            required: false,
        },
        rejectionNotes: {
            type: String,
            required: false,
        },
        cancelDateTime: {
            type: String,
            required: false,
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
const AffiliateProgram = mongoose.model('Affiliate_Program_Users', affiliateUsersSchema)
export default AffiliateProgram;