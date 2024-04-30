import mongoose from 'mongoose';

const AutoIncrementSequenceValuesSchema = mongoose.Schema(
    {

        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        columnName: {
            type: String,
            required: true,
        },
        sequenceValue: {
            type: String,
            required: true,
        },
        defaultQuotationPrefixNumber: {
            type: String,
            required: true,
        },

    })
const AutoIncrementSequenceValues = mongoose.model('ai_sequence_values', AutoIncrementSequenceValuesSchema)

export default AutoIncrementSequenceValues;