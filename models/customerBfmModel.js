import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const customerSchema = mongoose.Schema(
    {
        businessUserID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        customerType: {
            type: String,
            required: true,
        },
        businessName: {
            type: String,
          
        },
        addressType: {
            type: String,
          
        },
        businessID: {
            type: String,
            require :false
            
        },
        websiteName: {
            type: String,
        },
        registrationDate: {
            type: Date,
            // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        emailAddress: {
            type: String,
        },

        // countryCode:{
        //     type: String,
        // },
        phoneNumber: {
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
        emailOTP:{
            type: String, 
        },
        mobileOTP:{
            type: String, 
        },
        password: {
            type: String,
        },
        firstTimeUser:{
            type: Number, 
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
          
        },
        paymentType: {
            type: String,
           
        },
        accountNumber: {
            type: String,
           
        },
        customerStatus: {
            type: String,
           
        },
        notes: {
            type: String,
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
        customerCode:{
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
customerSchema.plugin(paginate);
customerSchema.plugin(aggregatePaginate);
const Customer = mongoose.model('customers', customerSchema)
export default Customer;