import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const productSchema = new Schema({

    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },
    subCategory: {
        type: Schema.Types.ObjectId,
        ref: "SubCategory"
    },
    sizes: [
        {
            type: String,
        }
    ],
    colors: [
        {
            type: String
        }
    ],
    material: {
        type: String,
        required: true
    },
    style: {
        type: String,
        required: true
    },
    tags: [
        {
            type: String
        }
    ],
    rating: {
        type: Number,
        default: 0.0
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Reviews"
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
});

productSchema.plugin(mongooseAggregatePaginate)


export const Product = mongoose.model("Product", productSchema)