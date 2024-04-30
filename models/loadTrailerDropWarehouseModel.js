import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const loadTrailersWareSchema = mongoose.Schema(
    {

        loadPlanVehiclesID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        dropWarehouseID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        uploadedSignaturePath: {
            type: String,

        },
        trailerStatus: {
            type: String,

        },
        jobStatus: {
            type: String,
        },

        jobID: {
            type: mongoose.Schema.Types.ObjectId,
        },

        createdBy: {
            type: Number,
        },
        warehouseRecievedDateTime: {
            type: Date,
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
loadTrailersWareSchema.plugin(paginate);
loadTrailersWareSchema.plugin(aggregatePaginate);
const LoadTrailerDropWarehouses = mongoose.model('load_Trailer_DropWarehouses', loadTrailersWareSchema)

export default LoadTrailerDropWarehouses;