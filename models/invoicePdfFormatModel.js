import mongoose from 'mongoose';

const invoicePdfFormatSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        themeName: {
            type: String,
            required: true,
        },
        fontStyle: {
            type: String,
            required: true,
        },
        fontSize: {
            type: String,
            required: true,
        },
        logoAlignment: {
            type: String,
            required: true,
        },
        contactDetails: {
            type: String,
            required: true,
        },
        showTaxNumber: {
            type: Boolean,
        },
        showColHead: {
            type: Boolean,
        },
        showItemCode: {
            type: Boolean,
        },
        showRegdAddress: {
            type: Boolean,
        },
        hideDiscount: {
            type: Boolean,
        },
        showAccNumber: {
            type: Boolean,
        },
        termsAndPaymentAdvice: {
            type: String,
        },
        showPaymentAdvice: {
            type: Boolean,
        },
        showPriceQuantity: {
            type: Boolean,
        },
        showTaxColumn: {
            type: Boolean,
        },
        showLogo: {
            type: Boolean,
        },
        createdDate: {
            type: Date,
            required: true,
        },
        lastModifiedDate: {
            type: Date,
        },
        recordType: {
            type: String,
            default: 'I',
        }
    }
)

const InvoicePdfFormat = mongoose.model('invoicepdfformat', invoicePdfFormatSchema)

export default InvoicePdfFormat;


