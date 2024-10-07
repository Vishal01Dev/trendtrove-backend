import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { SubCategory } from '../../models/subCategory.model.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import mongoose, { isValidObjectId } from 'mongoose'

const addSubCategory = asyncHandler(async (req, res) => {

    try {
        const { name, categoryId } = req.body

        if (!name || !categoryId) {
            throw new ApiError(400, "Please provide all the required fields.")
        }

        if (!isValidObjectId(categoryId)) {
            throw new ApiError(400, "Invalid Category ID")
        }

        const subCategory = await SubCategory.create({
            name,
            category: categoryId
        })

        if (!subCategory) {
            throw new ApiError(500, "Failed to create sub category");
        }

        return res.status(201)
            .json(
                new ApiResponse(201, subCategory, "sub category created successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while adding the sub category")
    }

})

const updateSubCategory = asyncHandler(async (req, res) => {
    try {

        const { subCategoryId } = req.params
        const { name, categoryId } = req.body

        if (!name) {
            throw new ApiError(400, "Please provide the name field to update the sub category.")
        }

        if (!subCategoryId || !isValidObjectId(subCategoryId)) {
            throw new ApiError(400, "Invalid Sub Category Id")
        }

        if (!categoryId || !isValidObjectId(categoryId)) {
            throw new ApiError(400, "Invalid Category Id")
        }

        const subCategory = await SubCategory.findById(subCategoryId)
        if (!subCategory) {
            throw new ApiError(404, "Sub Category not found")
        }

        const updatedSubCategory = await SubCategory.findByIdAndUpdate(subCategoryId,
            {
                name,
                category: categoryId
            },
            {
                new: true
            }
        )

        if (!updatedSubCategory) {
            throw new ApiError(409, 'Failed to update the sub category')
        }

        res.status(200)
            .json(
                new ApiResponse(200, updatedSubCategory, "sub category Updated Successfully")
            )



    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating the sub category")
    }
})

const deleteSubCategory = asyncHandler(async (req, res) => {
    try {

        const { subCategoryId } = req.params

        if (!subCategoryId || !isValidObjectId(subCategoryId)) {
            throw new ApiError(400, "Invalid Sub Category Id")
        }

        await SubCategory.deleteOne({
            _id: subCategoryId
        })

        res.status(200).
            json(
                new ApiResponse(200, {}, "Sub Category deleted Successfully")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while delete the sub category")
    }
})

const toggleSubCategoryStatus = asyncHandler(async (req, res) => {
    try {
        const { subCategoryId } = req.params;

        if (!subCategoryId || !isValidObjectId(subCategoryId)) {
            throw new ApiError(400, "Invalid sub category ID");
        }

        const subCategory = await SubCategory.findById(subCategoryId)

        if (!subCategory) {
            throw new ApiError(404, "Sub Category not found!");
        }

        const updatedSubCategory = await SubCategory.findByIdAndUpdate(subCategoryId,
            {
                isActive: !subCategory.isActive
            },
            {
                new: true
            }
        );

        const subCategoryDetail = await SubCategory.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(updatedSubCategory._id),
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                name: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$category"
            },
            {
                $addFields: {
                    category: '$category.name'
                }
            }
        ])

        if (!updatedSubCategory || !subCategoryDetail || subCategoryDetail.length === 0) {
            throw new ApiError(500, "Failed to update sub category status");
        }

        return res.status(200)
            .json(
                new ApiResponse(200, subCategoryDetail[0], "sub Category Status Updated Successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating the status of sub category")
    }

})

const getAllSubCategories = asyncHandler(async (req, res) => {

    try {

        const subCategories = await SubCategory.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                name: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$category"
            },
            {
                $addFields: {
                    category: '$category.name'
                }
            }
        ]).sort({ createdAt: -1 });

        if (!subCategories || subCategories.length === 0) {
            throw new ApiError(404, "No sub Categories Found!")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, subCategories, 'Sub Categories Retrieved Successfully')
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the sub catetgories")
    }

})


export {
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    toggleSubCategoryStatus,
    getAllSubCategories
}