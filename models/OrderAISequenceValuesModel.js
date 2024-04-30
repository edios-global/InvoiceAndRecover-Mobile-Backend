import mongoose from 'mongoose';

const orderAISequenceValuesSchema = mongoose.Schema(
    {
        CustomerID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        columnName: {
            type: String,
            required: true,
        },
        sequenceValue: {
            type: Number,
            required: true,
        },

    })
const OrderAISequenceValues = mongoose.model('order_sequence', orderAISequenceValuesSchema)

export default OrderAISequenceValues;