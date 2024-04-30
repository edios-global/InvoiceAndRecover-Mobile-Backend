import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const employeeSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        gender: {
            type: String,
           
        },
        birthDate: {
            type: Date,
          
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
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        stateId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        businessUserID:{
            type: mongoose.Schema.Types.ObjectId,
        },
        emailAddress: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        profileFileName: {
            type: String,
           
        },
        employeeStatus: {
            type: String,
        },
        emergencyContactName: {
            type: String,
           
        },
        emergencyContactNumber: {
            type: String,
           
        },
        relationshipWithEmployee: {
            type: String,
        },
        notes: {
            type: String,
        },
        employeeType: {
            type: String,
        },
        employeeCode: {
            type: String,
        },
        joiningDate: {
            type: Date,
        },
        releivingDate: {
            type: Date,
                      
        },
        department: {
            type: String,
            
        },
        designation: {
            type: String,
            
        },
        circle: {
            type: String,
          
        },
        location: {
            type: String,
           
        },
        iDCardIssueDate: {
            type: Date,
            
        },
        iDCardFileName: {
            type: String,
           
        },
        attendanceType: {
            type: String,
          
        },
        recruitmentType: {
            type: String,
           
        },
        experienceYears: {
            type: String,
          
        },
        experienceMonths: {
            type: String,
          
        },
        reportingManagerEmployeeID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        taxFileNumber: {
            type: String,
           
        },
        memberNumber: {
            type: String,
            
        },
        superGuaranteeFundProduct: {
            type: String,
        },
        mobileAppAccess: {
            type: String,
        },
        employeeWarehouseLocation: {
            type: mongoose.Schema.Types.ObjectId,
        },
        mobileAppUserName: {
            type: String,
        },
        mobileAppUserPassword: {
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

employeeSchema.plugin(paginate);
employeeSchema.plugin(aggregatePaginate);
const Employee = mongoose.model('employees', employeeSchema)

export default Employee;