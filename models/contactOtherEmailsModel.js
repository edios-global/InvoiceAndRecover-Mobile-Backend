import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const contactOtherEmailsSchema = mongoose.Schema(
    {
        contactUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        otherEmailAddress: {
            type: String,
            required: true,
        },
        createdDate: {
            type: Date,
            required: true,
            // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
contactOtherEmailsSchema.plugin(paginate);
contactOtherEmailsSchema.plugin(aggregatePaginate);
const ContactOtherEmails = mongoose.model('contact_other_emails', contactOtherEmailsSchema)
export default ContactOtherEmails;