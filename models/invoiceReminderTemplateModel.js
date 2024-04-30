import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceReminderTemplateSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        reminderTemplateName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
        },
        emailSubject: {
            type: String,
        },
        reminderType: {
            type: String,
        },
        reminderDays: {
            type: Number,
        },
        uploadLegalDocument: {
            type: String,
        },
        emailBody: {
            type: String,
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
invoiceReminderTemplateSchema.plugin(paginate);
invoiceReminderTemplateSchema.plugin(aggregatePaginate);
const invoiceReminderTemplate = mongoose.model('invoiceremindertemplates', invoiceReminderTemplateSchema)

export default invoiceReminderTemplate;