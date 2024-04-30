import mongoose from 'mongoose';

const customerOrderAddressesSchema = mongoose.Schema(
    {
        customerID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        addressCategory: {
            type: String,
            required: true,
        },
        addressType: {
            type: String,
            required: true,
          
        },
        contactName: {
            type: String,
            required: true,
            
        },
        phoneNumber: {
            type: String,
            required: true,
        },
  
        streetAddress: {
            type: String,
            required: true,

        },
        city: {
            type: String,
            required: true,
        },
        zipCode: {
            type: String,
            required: true,
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        stateId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        locationLatitude: {
            type: String,
            required: true,
        },
        locationLongitude: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Number,
        },
        createdDate: {
            type: Date,
            required: true,
            // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        customerLocationLatitude:{
            type:String,
        },
        customerLocationLongitude:{
            type:String,
        },
        gatewayUserID:{
            type:String,
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

const CustomerOrderAddresses = mongoose.model('customer_order_addresses', customerOrderAddressesSchema)

export default CustomerOrderAddresses;