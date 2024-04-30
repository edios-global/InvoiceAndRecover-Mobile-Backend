import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const contactsSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        contactType: {
            type: String,

        },
        companyName: {
            type: String,


        },
        companyAccountNo: {
            type: String,

        },
        name: {
            type: String,

        },
        phoneNumber: {
            type: String,
        },
        emailAddress: {
            type: String,
        },

        websiteName: {
            type: String,
        },
        abnNumber: {
            type: String,
        },
        paymentTerms: {
            type: String,
        },
        invoiceReminder: {
            type: String,
        },
        streetAddress: {
            type: String,
        },
        city: {
            type: String,
        },
        zipCode: {
            type: String,
        },
        stateId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        contactLogoFileName: {
            type: String,
        },
        notes: {
            type: String,
        },
        contactStatus: {
            type: String,
        },
        // otherEmailAddress: [
        //     {
        //         type: String
        //     }
        // ],
        createdDate: {
            type: Date,
            // required: true,
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
            // required: true,
            default: 'I',
        }
    }
)
contactsSchema.plugin(paginate);
contactsSchema.plugin(aggregatePaginate);
const Contacts = mongoose.model('contacts', contactsSchema)
export default Contacts;