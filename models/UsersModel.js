import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const UsersSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
        },
        emailAddress: {
            type: String,
            required: true,
        },
        employeeID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        profilePictureFileName: {
            type: String,
        },
        userType: {
            type: String,
            required: false,
        },
        userStatus: {
            type: String,
            required: true
        },
        userPassword: {
            type: String,
        },
        firstTimeUser: {
            type: Number,
            default: 1
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        roleID: {
            type: mongoose.Schema.Types.ObjectId,
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
        },

    }
)
// UsersSchema.plugin(paginate);
// UsersSchema.plugin(aggregatePaginate);
const Users = mongoose.model('users', UsersSchema)
export default Users;