import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { Query } from '../../models/query.model.js'
import { isValidObjectId } from 'mongoose'
import sendEmail from '../../utils/SendMail.js'

const getAllQueries = asyncHandler(async (req, res) => {

    try {

        const queries = await Query.find().sort({ createdAt: -1 })

        if (!queries || queries.length === 0) throw new ApiError(404, "No query found")

        return res.status(200)
            .json(
                new ApiResponse(200, queries, "Queries fetched successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while fetching all the queries")
    }

})

const replyQuery = asyncHandler(async (req, res) => {
    try {

        const { queryId } = req.params
        const { reply } = req.body;

        if (!queryId || !isValidObjectId(queryId)) throw new ApiError(400, "Invalid query ID provided");

        if (!reply) throw new ApiError(400, "Reply field cannot be empty!");

        const query = await Query.findById(queryId)

        if (!query) throw new ApiError(404, "The specified query does not exist.")


        const emailData = {
            to: query.email,
            subject: `Reply to: ${query.subject}`,
            html: reply,
        };

        const mailSent = await sendEmail(emailData)

        if (!mailSent.success) throw new ApiError(503, "Failed to send email.")

        const updatedQuery = await Query.findByIdAndUpdate(queryId,
            {
                reply: reply
            },
            { new: true })


        if (!updatedQuery) throw new ApiError(500, "Failed to update the query")

        return res.status(200)
            .json(
                new ApiResponse(200, updatedQuery, 'Query replied successfully')
            )


    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while replying to the query")
    }
})

export {
    getAllQueries,
    replyQuery
}