import mongoose from 'mongoose';

const ThemesSchema = mongoose.Schema(
    {
      
        themeValue:{
           type:Boolean,
           default:false,
        },
       
        userID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        createdBy: {
            type: Number,
            required: false,
        },
        // createdDate: {
        //     type: Date,
        //     required: true,
        // },
        lastModifiedDate: {
            type: Date,
        },
        lastModifiedBy: {
            type: Number,
        },
        // recordType: {
        //     type: String,
        //     required: true,
        //     default: 'I',
        // }
       
    }
)
const Themes = mongoose.model('themes', ThemesSchema)
export default Themes;