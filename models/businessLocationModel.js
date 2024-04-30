import mongoose from 'mongoose';

const businessLocationSchema = mongoose.Schema(
    {

        locationCity: {
            type: String,
            required: true,
        },
        locationStreetAddress: {
            type: String,
            required: true,
        },
        zipCode: {
            type: String,
            required: true,
        },
        stateId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        locationStatus: {
            type: String,
            required: true,
        },
        defaultLocation: {
            type: String,
            required: true,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        companyTimeZone: {
            type: String,
            required: false,
        },
        sendingFromHour: {
            type: String,
            required: false,
        },
        sendingToHour: {
            type: String,
            required: false,
        },
        sendingFromHourIndex: {
            type: Number,
            required: false,
        },
        sendingToHourIndex: {
            type: Number,
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
        }

    })
const businessLocation = mongoose.model('business_locations', businessLocationSchema)

export default businessLocation;