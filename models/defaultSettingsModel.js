import mongoose from 'mongoose';

const defaultSettingsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        invoiceDueDays: {
            type: Number,
        },
        invoiceDueType: {
            type: String,
        },
        invoicePrefix: {
            type: String,
        },
        invoiceStartNumber: {
            type: String,
        },
        rctiDueDays: {
            type: Number,
        },
        rctiDueType: {
            type: String,
        },
        rctiPrefix: {
            type: String,
        },
        rctiStartNumber: {
            type: String,
        },
        creditNotePrefix: {
            type: String,
        },
        creditNoteStartNumber: {
            type: String,
        },
        quotationPrefix: {
            type: String,
        },
        quotationStartNumber: {
            type: String,
        },
        quotationDueDays: {
            type: Number,
        },
        quotationDueType: {
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
        currencyValue: {
            type: String,
        },
        signatureFilePath: {
            type: String,
        },
        signatureUploadedDate: {
            type: Date,
        },
        defaultLogoFileName: {
            type: String,
        },
        // recordType: {
        //     type: String,
        //     required: true,
        //     default: 'I',
        // }
    }
)

const DefaultSetting = mongoose.model('defaultSettings', defaultSettingsSchema)

export default DefaultSetting;