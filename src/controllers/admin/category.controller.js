import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { Category } from '../../models/category.model.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { isValidObjectId } from 'mongoose'

const addCategory = asyncHandler(async (req, res) => {

    try {
        const { name } = req.body

        if (!name) {
            throw new ApiError(400, "Name field is required")
        }

        const category = await Category.create({
            name
        })

        if (!category) {
            throw new ApiError(500, "Failed to create category")
        }

        res.status(201).
            json(
                new ApiResponse(201, category, "Successfully created a new category")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while adding the category")
    }

})


const updateCategory = asyncHandler(async (req, res) => {
    try {

        const { categoryId } = req.params
        const { name } = req.body

        if (!categoryId || !isValidObjectId(categoryId)) {
            throw new ApiError(400, "Invalid category id")
        }

        if (!name) {
            throw new ApiError(400, "Name field is required.")
        }

        const category = await Category.findById(categoryId)

        if (!category) {
            throw new ApiError(404, "Category not found")
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name }, { new: true })

        if (!updateCategory) {
            throw new ApiError(500, "Failed to update category")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, updatedCategory, "Category updated successfully!"),
            )


    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating the category")
    }
})

const deleteCategory = asyncHandler(async (req, res) => {

    try {
        const { categoryId } = req.params

        if (!categoryId || !isValidObjectId(categoryId)) {
            throw new ApiError(400, "Invalid category id")
        }

        await Category.deleteOne({
            _id: categoryId
        })

        return res.status(200)
            .json(
                new ApiResponse(200, { _id: categoryId }, 'Category deleted successfully!'),
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while deleting the category")
    }

})


const toggleCategoryStatus = asyncHandler(async (req, res) => {
    try {
        const { categoryId } = req.params;

        if (!categoryId || !isValidObjectId(categoryId)) {
            throw new ApiError(400, "Invalid category ID");
        }

        const category = await Category.findById(categoryId)

        if (!category) {
            throw new ApiError(404, "Category not found!");
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId,
            {
                isActive: !category.isActive
            },
            {
                new: true
            }
        );

        if (!updatedCategory) {
            throw new ApiError(500, "Failed to update category status");
        }

        return res.status(200)
            .json(
                new ApiResponse(200, updatedCategory, "Category Status Updated Successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating the status of category")
    }

})

const getAllCategories = asyncHandler(async (req, res) => {

    try {

        const categories = await Category.find().sort({ createdAt: -1 })

        if (!categories || categories.length === 0) {
            throw new ApiError(404, "No Categories Found!")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, categories, 'Categories Retrieved Successfully')
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the catetgories")
    }

})

export {
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    getAllCategories
}