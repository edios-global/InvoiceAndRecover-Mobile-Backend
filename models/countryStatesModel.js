import mongoose from 'mongoose';

const countryStatesSchema = mongoose.Schema(
  {
    countryId:{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
    },
    stateCode: {
        type: String,
        required: true,
    },
    stateName: {
        type: String,
        required: true,
    },
    stateStatus: {
        type: String,
        required: true,
    },
  })
  const countryStates = mongoose.model('country_states', countryStatesSchema)

export default countryStates;