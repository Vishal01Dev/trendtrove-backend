import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },
    rating: {
        type: Number,
        required: true
    },
    reviewContent: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});

export const Review = mongoose.model('Reviews', reviewSchema);