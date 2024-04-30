import mongoose from 'mongoose';

const countrySchema = mongoose.Schema(
  {
   
    countryName: {
        type: String,
        required: true,
    },
    countryStatus: {
        type: String,
        required: true,
    },
  })
  const country = mongoose.model('country', countrySchema)

export default country;