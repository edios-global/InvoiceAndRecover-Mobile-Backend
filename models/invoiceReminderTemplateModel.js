import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceReminderSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        reminderTemplateName: {
            type: String,
            required: true,
        },
        Status: {
            type: String,
            required: true,
            default: "Active"
        },
        reminderType: {
            type: String,
            required: true,
            default: "Overdue By"
        },
        reminderDays: {
            type: Number,
            required: true,
        },
        legalDocumentStatus: {
            type: Boolean,
            required: true,
            default: false
        },
        legalDocumentID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        emailSubject: {
            type: String,
            required: false,
        },
        emailBody: {
            type: String,
            required: true,
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
invoiceReminderSchema.plugin(paginate);
invoiceReminderSchema.plugin(aggregatePaginate);
const InvoiceReminder = mongoose.model('invoiceReminderTemplate', invoiceReminderSchema)
export default InvoiceReminder;