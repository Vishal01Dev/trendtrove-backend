import mongoose, { Schema } from "mongoose";

const subCategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

export const SubCategory = mongoose.model("SubCategory", subCategorySchema);