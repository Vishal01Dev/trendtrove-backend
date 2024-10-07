import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/user.model.js';
import mongoose, { isValidObjectId } from "mongoose";

const getAllUsers = asyncHandler(async (req, res) => {
    try {

        const users = await User.find().select("-refreshToken -password").sort({ createdAt: -1 })

        return res.status(200)
            .json(
                new ApiResponse(200, users, "Successfully retrieved all users")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error")
    }
})


const getAllUserDetailsById = asyncHandler(async (req, res) => {
    try {

        const { userId } = req.params

        if (!isValidObjectId(userId) || !userId) {
            throw new ApiError(400, "Invalid user ID");
        }

        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'orders',
                }
            }
        ])


        if (!user || user === null) {
            throw new ApiError(404, 'user not found');
        }

        res.status(200)
            .json(
                new ApiResponse(200, user[0], "User fetched successfully.")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || " Something went wrong while fetching user")
    }
})

export { getAllUsers, getAllUserDetailsById }