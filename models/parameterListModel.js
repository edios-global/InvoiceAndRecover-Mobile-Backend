import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const parameterListSchema = mongoose.Schema(
    {
        parameterId: {
            type: mongoose.Schema.Types.ObjectId,
           
        },
        parameterListName: {
            type: String,
           
        },
        parameterListCode: {
            type: String,
            
        },
        parameterListSequence: {
            type: Number,
           
        },
        parameterListStatus: {
            type: String,
           
        },
        customValue1: {
            type: String,
          
        },
        customValue2: {
            type: String,
         
        },
        customValue3: {
            type: String,
       
        },
        customValue4: {
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
parameterListSchema.plugin(paginate);
parameterListSchema.plugin(aggregatePaginate);
const ParameterList = mongoose.model('parameter_lists', parameterListSchema)

export default ParameterList;