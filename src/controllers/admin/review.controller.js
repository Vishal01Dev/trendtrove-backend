import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Review } from "../../models/review.model.js";

const getAllReviews = asyncHandler(async (req, res) => {

    try {

        const reviews = await Review.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                firtName: 1,
                                lastName: 1,
                                username: 1,
                                _id: 1,
                                email: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$user'
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: 'product',
                }
            },
            {
                $unwind: '$product'
            }
        ]).sort({ createdAt: -1 });

        if (!reviews || reviews.length === 0) throw new ApiError(404, "Reviews not found")

        return res.status(200)
            .json(
                new ApiResponse(200, reviews, "Reviews fetched successfully")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching all reviews")
    }

})

export {
    getAllReviews
}