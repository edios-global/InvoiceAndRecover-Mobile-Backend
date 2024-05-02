import mongoose from 'mongoose';

const defaultSettingsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        invoiceDues: {
            type: Number,
        },
        invoiceTypes: {
            type: String,
        },
        invoiceStartNumber: {
            type: String,
        },
        invoicePrefix: {
            type: String,
        },
        rctiPrefix: {
            type: String,
        },
        rctiStartNumber: {
            type: String,
        },
        rctiDues: {
            type: Number,
        },
        rctiTypes: {
            type: String,
        },
        creditNotePrefix: {
            type: String,
        },
        creditNoteNumber: {
            type: String,
        },
        quotationPrefix: {
            type: String,
        },
        quotationStartNumber: {
            type: String,
        },
        quotationDues: {
            type: Number,
        },
        quotationTypes: {
            type: String,
        },
        currencyValue: {
            type: String,
        },
        signatureFilePath: {
            type: String,
        },
        signatureUploadedDate: {
            type: Date
        },
        defaultLogoFileName: {
            type: String,
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

const DefaultSetting = mongoose.model('defaultSettings', defaultSettingsSchema)

export default DefaultSetting;