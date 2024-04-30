import mongoose from 'mongoose';

const apBankDetalsSchema = mongoose.Schema(
  {
   
    bankName: {
        type: String,
        required: true,
    },
    accountHolderName: {
        type: String,
        required: true,
    },
    bankCode: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
        required: true,
    },
    AccountNumber:{
        type: String,
        required: true,
    },
    apUserID:{
        type: mongoose.Schema.Types.ObjectId,
    }


  })
  const apBankDetails = mongoose.model('ap_bank_details', apBankDetalsSchema)

export default apBankDetails;