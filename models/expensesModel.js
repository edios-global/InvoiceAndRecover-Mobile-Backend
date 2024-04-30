import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";


const expensesSchema = mongoose.Schema(
    {
        categoryNameID:{
            required:true,
            type: mongoose.Schema.Types.ObjectId,
        },
        contactTypeId: {
            required:true,
            type: mongoose.Schema.Types.ObjectId,
        },
        businessUserID: {
            required:true,
            type: mongoose.Schema.Types.ObjectId,
        },
        expenseDate : {
            // required:true,
            type: Date,
        },
        totalAmount: {
            type: Number,
        },
        taxAmount: {
            type: Number,
        },
        tipAmount: {
            type:Number,
        },
        notes: {
            type:String,
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
expensesSchema.plugin(paginate);
expensesSchema.plugin(aggregatePaginate);
const expenses = mongoose.model('expenses', expensesSchema)

export default expenses;