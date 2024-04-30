import mongoose from 'mongoose'

const menuOptionsSchema = mongoose.Schema(
    {

        menuName: {
            type: String,
            required: true,
        },
        screenName: {
            type: String,
            required: true,
        },
        screenStatus: {
            type: String,
            default: "Active"
        },
        menuSequence: {
            type: Number,
        },
        screenSequence: {
            type: Number,
        },
        lastModifiedDate: {
            type: Date,
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        },
        lastModifiedBy: {
            type: Number,
        },
        createdBy: {
            type: Number,
        },
        recordType: {
            type: String,
            required: true,

        },

    }
)

const MenuOptions = mongoose.model('menu_options', menuOptionsSchema)

export default MenuOptions
