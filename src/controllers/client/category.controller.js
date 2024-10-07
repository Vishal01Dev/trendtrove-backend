import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Category } from "../../models/category.model.js";
import { isValidObjectId } from "mongoose";

const findCategoryById = asyncHandler(async (req, res) => {
    try {
        const { categoryId } = req.params

        if (!categoryId || !isValidObjectId(categoryId)) {
            throw new ApiError(400, "Invalid category id")
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            throw new ApiError(404, "Category not found")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, category, "category fetched successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the category")
    }

})

const getAllActiveCategories = asyncHandler(async (req, res) => {

    try {
        const categories = await Category.find({
            isActive: true
        }).exec();

        if (!categories) {
            throw new ApiError(404, "No active categories found.")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, categories, 'Categories fetched successfully')
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the categories")
    }
})



export {
    findCategoryById,
    getAllActiveCategories
}