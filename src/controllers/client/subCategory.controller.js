import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import mongoose, { isValidObjectId } from 'mongoose'
import { SubCategory } from '../../models/subCategory.model.js'


const findSubCategoryById = asyncHandler(async (req, res) => {
    try {
        const { subCategoryId } = req.params

        if (!subCategoryId || !isValidObjectId(subCategoryId)) {
            throw new ApiError(400, "Invalid sub category id")
        }

        const subCategory = await SubCategory.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(subCategoryId)
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
                                name: 1,
                                _id: 1
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
                    category: '$category.name',
                    categoryId: '$category._id'
                }
            }
        ]);

        if (!subCategory || subCategory.length === 0) {
            throw new ApiError(404, "Sub Category not found")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, subCategory[0], "Sub category fetched successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the sub category")
    }

})

const getAllActiveSubCategories = asyncHandler(async (req, res) => {

    try {
        const subCategories = await SubCategory.find({
            isActive: true
        }).exec();

        if (!subCategories) {
            throw new ApiError(404, "No active sub categories found.")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, subCategories, 'Sub Categories fetched successfully')
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the sub categories")
    }
})



export {
    findSubCategoryById,
    getAllActiveSubCategories
}