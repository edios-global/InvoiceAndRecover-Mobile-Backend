import mongoose from 'mongoose';

const checklistSchema = mongoose.Schema(
    {
    
        checkListName : {
            type: String, 
        },
        
        checkListSequence: {
            type: String,
        },
        checkListType: {
            type: String,
            required: true,

        },
        checkListStatus: {
            type: String,
            required: true,

        },
        createdDate: {
            type: Date,
        
            // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        createdBy: {
            type: Number,
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

        },





    }
)

const Checklist = mongoose.model('driver_checkList', checklistSchema)

export default Checklist;