import mongoose from 'mongoose';
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const itemCategoriesSchema = mongoose.Schema(
    {
        categoryName: {
            type: String,
        },
        categoryCode: {
            type: String,
        },
        categoryStatus: {
            type: String,
        },
        businessUserID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        createdDate: {
            type: Date,
            required: true,
            default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
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
            default: 'I',
        }

    }
)
itemCategoriesSchema.plugin(paginate);
itemCategoriesSchema.plugin(aggregatePaginate);
const itemCategories = mongoose.model('itemCatogories', itemCategoriesSchema)

export default itemCategories;