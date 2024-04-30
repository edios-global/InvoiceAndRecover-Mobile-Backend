import mongoose from 'mongoose';

const TestDataSchema = mongoose.Schema(
    {

        name: {
            type: String,
        },

        type: {
            type: String,
        },

        length: {
            type: String,
        },
        
        decimal: {
            type: String,
        },
        createdBy: {
            type: Number,
        },
        createdDate: {
            type: Date,
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
            default: 'I',
        }
    }
)

const TestData = mongoose.model('test_data', TestDataSchema)

export default TestData;