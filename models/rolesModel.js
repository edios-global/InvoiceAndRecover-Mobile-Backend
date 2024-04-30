import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const rolesSchema = mongoose.Schema(
    {
        roleName: {
            type: String,
            required: true,
        },
        planID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        applicableForBusinessUser: {
            type: String,
            required: true
        },
        defaultPlanRole: {
            type: String,
            required: true,
            default: "No"
        },
        roleDescription: {
            type: String,
        },
        lastModifiedDate: {
            type: Date,
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        lastModifiedBy: {
            type: Number,
        },
        createdBy: {
            type: Number,
        },
        recordType: {
            type: String,
            required: true,
            default: 'I',

        },

    }
)
rolesSchema.plugin(paginate);
rolesSchema.plugin(aggregatePaginate);
const Roles = mongoose.model('roles', rolesSchema)

export default Roles
