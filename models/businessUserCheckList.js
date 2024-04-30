import mongoose from 'mongoose';

const businessUserChecklistSchema = mongoose.Schema(
    {

    checkListID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
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
        }

    })
const BussinessUserChecklist = mongoose.model('business_checkList', businessUserChecklistSchema)

export default BussinessUserChecklist;