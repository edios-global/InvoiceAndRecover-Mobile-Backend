import mongoose from 'mongoose';

const SequenceValuesSchema = mongoose.Schema(
    {
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        sequenceName: {
            type: String,
            required: true,
        },
        sequenceValue: {
            type: Number,
            required: true,
        },

    })
const GenerateSequence = mongoose.model('generate_sequence', SequenceValuesSchema)

export default GenerateSequence;