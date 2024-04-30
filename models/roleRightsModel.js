import mongoose from 'mongoose'
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const roleRightsSchema = mongoose.Schema(
    {

        roleId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        menuOptionId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        screenRight: {
            type: String,
            required: true,
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
roleRightsSchema.plugin(paginate);
roleRightsSchema.plugin(aggregatePaginate);

const RoleRights = mongoose.model('role_rights', roleRightsSchema)

export default RoleRights
