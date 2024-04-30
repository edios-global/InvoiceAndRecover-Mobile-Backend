import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const invoiceReminderLogsSchema = mongoose.Schema(
    {
        invoiceID: {
            type: mongoose.Schema.Types.ObjectId,

        },
        invoiceReminderID: {
            type: mongoose.Schema.Types.ObjectId,

        },
        reminderDateTime: {
            type: Date,
        },
        recievedInvoiceAmount: {
            type: String,
        },
        createdBy: {
            type: Number,
            // required: false,
        },
        createdDate: {
            type: Date,
            // required: true,
        },
        lastModifiedDate: {
            type: Date,
        },
        lastModifiedBy: {
            type: Number,
        },
        recordType: {
            type: String,
            // required: true,
            default: 'I',
        }

    })
invoiceReminderLogsSchema.plugin(paginate);
invoiceReminderLogsSchema.plugin(aggregatePaginate);
const invoiceReminderLog = mongoose.model('invoicereminderlogs', invoiceReminderLogsSchema)

export default invoiceReminderLog;