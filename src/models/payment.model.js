import mongoose, { Schema } from "mongoose";


const paymentSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: "Order"
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["CREDITCARD", "PAYPAL", "COD"],
        required: true
    },
    paymentToken: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});


export const Payment = mongoose.model("Payment", paymentSchema);