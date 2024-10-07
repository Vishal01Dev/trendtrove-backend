import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Review } from "../../models/review.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Product } from "../../models/product.model.js";

const calculateAverageRatings = async (productId) => {
    try {

        const product = await Product.findById(productId)

        const reviews = await Review.find({ product: productId })

        let totalRatings = 0;

        for (const r of reviews) {
            totalRatings += r.rating
        }

        const avgRating = totalRatings / reviews.length

        product.rating = avgRating

        await product.save()

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while calculating average rating")
    }
}

const addReview = asyncHandler(async (req, res) => {

    try {

        const { productId } = req.params
        const { rating, content } = req.body
        const userId = req.user?._id

        if (!userId || !isValidObjectId(userId)) throw new ApiError(400, "Invalid user id")
        if (!productId || !isValidObjectId(productId)) throw new ApiError(400, "Invalid product id")

        if (!rating || !content) throw new ApiError(400, "Please provide rating and review content")

        const alreadyExist = await Review.findOne({
            user: userId,
            product: productId
        })

        if (alreadyExist) {
            throw new ApiError(400, "You already gave your feedback on this product")
        }

        const review = await Review.create({
            user: userId,
            product: productId,
            rating,
            reviewContent: content
        })

        if (!review) throw new ApiError(500, "faild to add review")


        await Product.findByIdAndUpdate(productId,
            {
                $push: {
                    reviews: review._id
                }
            }
        )

        await calculateAverageRatings(productId)

        return res.status(201)
            .json(
                new ApiResponse(200, review, "Review added successfully")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while adding review")
    }

})

const deleteReview = asyncHandler(async (req, res) => {
    try {

        const { reviewId } = req.params

        const userId = req.user?._id

        if (!reviewId || !isValidObjectId(reviewId)) throw new ApiError(400, "Invalid review id")

        if (!userId || !isValidObjectId(userId)) throw new ApiError(403, "Unauthorized request")

        const review = await Review.findOne({
            _id: reviewId,
            user: userId
        })

        if (!review) throw new ApiError(404, "Review not found or this review not belongs to you")

        await Product.findByIdAndUpdate(review?.product,
            {
                $pull: {
                    reviews: review._id
                }
            }
        )

        await Review.findByIdAndDelete(reviewId)

        await calculateAverageRatings(review?.product)

        return res.status(200)
            .json(
                new ApiResponse(200, {}, "Review deleted successfully")
            )


    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while adding review")
    }
})

const getReviewsByProduct = asyncHandler(async (req, res) => {
    try {

        const { productId } = req.params

        if (!productId || !isValidObjectId(productId)) throw new ApiError(400, "Invalid product id")

        const reviews = await Review.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId)
                }
            },
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
            }
        ])


        if (!reviews || reviews.length === 0) throw new ApiError(404, "Reviews not found")

        return res.status(200)
            .json(
                new ApiResponse(200, reviews, "Reviews fetched successfully")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching reviews")
    }
})

export {
    addReview,
    deleteReview,
    getReviewsByProduct
}