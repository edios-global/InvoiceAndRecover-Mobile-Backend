import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const warehouseSchema = mongoose.Schema(
    {

        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        warehouseName: {
            type: String,
        },

        warehouseCode: {
            type: String,
        },
        contactPersonName: {
            type: String,
        },
        contactPersonNumber: {
            type: String,
        },

        warehouseStatus: {
            type: String,
        },

        streetAddress: {
            type: String,
        },
        warehouseLocationLatitude: {
            type: String,
        },
        warehouseLocationLongitude: {
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
warehouseSchema.plugin(paginate);
warehouseSchema.plugin(aggregatePaginate);
const Warehouse = mongoose.model('warehouse', warehouseSchema)

export default Warehouse;