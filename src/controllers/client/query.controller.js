import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { Query } from '../../models/query.model.js'

const addQuery = asyncHandler(async (req, res) => {

    try {

        const { fullName, email, subject, message } = req.body

        if ([fullName, email, subject, message].some((field) => field?.trim() === "")) throw new ApiError(400, "All fields are required")

        const query = await Query.create({
            fullName,
            email,
            subject,
            message
        })

        if (!query) throw new ApiError(500, "Something went wrong try again later")

        return res.status(201)
            .json(
                new ApiResponse(201, query, "Query sent successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while adding the query")
    }

})

export {
    addQuery
}