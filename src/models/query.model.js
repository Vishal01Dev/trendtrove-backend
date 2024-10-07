import mongoose, { Schema } from 'mongoose'

const querySchema = new Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        reply: {
            type: String
        }
    },
    {
        timestamps: true
    }
)


export const Query = mongoose.model('Query', querySchema)