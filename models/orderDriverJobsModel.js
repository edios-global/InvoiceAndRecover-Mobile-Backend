import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const orderJobSchema = mongoose.Schema(
    {

        orderID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        loadVehicleID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        orderNumber: {
            type: Number,
        },
        assignedDriverID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        assignedDriverDateTime: {
            type: Date,
        },
        warehouseRecievedDateTime: {
            type: Date,
        },
        pickupContactName: {
            type: String,
        },
        pickupContactNumber: {
            type: String,
        },
        pickupStreetAddress: {
            type: String,
        },
        pickupCity: {
            type: String,
        },
        pickupZipCode: {
            type: String,
        },
        pickupCountryID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        pickupStateID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        dropContactName: {
            type: String,
        },
        dropContactNumber: {
            type: String,
        },
        dropStreetAddress: {
            type: String,
        },
        dropCity: {
            type: String,
        },
        dropZipCode: {
            type: String,
        },
        dropCountryID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        dropStateID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        senderWarehouseID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        dropWarehouseID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        jobNotes: {
            type: String,
        },
        jobStatus: {
            type: String,
        },
        jobStatusNotes: {
            type: Array,
        },
        jobNumber: {
            type: Number,
        },
        receiverEmployeeID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        uploadedSignaturePath: {
            type: String,
        },
        pickedDateTime: {
            type: Date,
        },
        reachedDateTime: {
            type: Date,
        },
        droppedDateTime: {
            type: Date,
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
orderJobSchema.plugin(paginate);
orderJobSchema.plugin(aggregatePaginate);

const OrderDriverJob = mongoose.model('order_Driver_Job', orderJobSchema)

export default OrderDriverJob;