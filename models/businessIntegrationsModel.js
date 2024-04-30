import mongoose from 'mongoose';

const businessIntegrationsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        businessLocationID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        integrationType: {
            type: String,
            required: true,
        },
        paraValue1: {
            type: String,
            required: false,
        },
        paraValue2: {
            type: String,
            required: false,
        },
        paraValue3: {
            type: String,
            required: false,
        },
        paraValue4: {
            type: String,
        },
        paraValue5: {
            type: String,
        },
        paraValue6: {
            type: String,
        },
        paraValue7: {
            type: String,
        },
        paraValue8: {
            type: String,
        },
        paraValue9: {
            type: String,
        },
        sessionStartDate: {
            type: Date,
        },
        sessionEndDate: {
            type: Date,
        },
        sessionStatus: {
            type: String,
            default: 'Connected'
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
    }
)
const BusinessIntegrationsModel = mongoose.model('business_integrations', businessIntegrationsSchema)
export default BusinessIntegrationsModel;