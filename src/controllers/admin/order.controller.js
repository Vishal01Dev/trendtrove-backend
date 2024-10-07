import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { ApiError } from '../../utils/ApiError.js'
import { Order } from '../../models/order.model.js'
import mongoose, { isValidObjectId } from 'mongoose'
import sendMail from '../../utils/SendMail.js'

const getUserOrders = asyncHandler(async (req, res) => {
    try {

        const { userId } = req.params

        if (!userId || !isValidObjectId(userId)) throw new ApiError(400, "Invalid  User ID")

        const orders = await Order.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                phoneNumber: 1,
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$user"
            },
            {
                $unwind: "$items"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "items.product",
                    pipeline: [
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
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$category"
                        },
                        {
                            $addFields: {
                                category: '$category.name'
                            }
                        },
                        {
                            $lookup: {
                                from: "subcategories",
                                localField: "subCategory",
                                foreignField: "_id",
                                as: "subCategory",
                                pipeline: [
                                    {
                                        $project: {
                                            name: 1,
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$subCategory"
                        },
                        {
                            $addFields: {
                                subCategory: '$subCategory.name'
                            }
                        },
                        {
                            $project: {
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$items.product"
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'order',
                    as: 'paymentDetails',
                    pipeline: [
                        {
                            $project: {
                                __v: 0,
                                createdAt: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$paymentDetails"
            },
            {
                $group: {
                    _id: "$_id",
                    user: { $first: "$user" },
                    items: {
                        $push: {
                            _id: "$items._id",
                            quantity: "$items.quantity",
                            product: "$items.product",
                            price: "$items.price"
                        }
                    },
                    shippingAddress: {
                        $first: '$shippingAddress'
                    },
                    status: {
                        $first: '$status'
                    },
                    paymentDetails: {
                        $first: '$paymentDetails'
                    }
                }
            }
        ])


        if (!orders || orders.length === 0) throw new ApiError(404, 'Orders not found');



        return res.status(200)
            .json(
                new ApiResponse(200, orders, "Orders fetched successfully!")
            )


    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching all user orders")
    }
})


const getOrdersByStatus = asyncHandler(async (req, res) => {
    try {

        const { status } = req.params

        if (!status) {
            throw new ApiError(400, "Please provide a valid status parameter.")
        }

        let orderStatus;

        if (status === "pending") {
            orderStatus = "PENDING"
        }
        else if (status === "active") {
            orderStatus = "PROCESSING"
        }
        else if (status === "shipping") {
            orderStatus = "SHIPPED"
        }
        else if (status == "delivered") {
            orderStatus = "DELIVERED"
        }
        else if (status == "cancelled") {
            orderStatus = "CANCELLED"
        }

        let orders;
        if (orderStatus) {

            orders = await Order.aggregate([
                {
                    $match: {
                        status: orderStatus
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "user",
                        pipeline: [
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    email: 1,
                                    phoneNumber: 1,
                                    _id: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $unwind: "$items"
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "items.product",
                        pipeline: [
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
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: "$category"
                            },
                            {
                                $addFields: {
                                    category: '$category.name'
                                }
                            },
                            {
                                $lookup: {
                                    from: "subcategories",
                                    localField: "subCategory",
                                    foreignField: "_id",
                                    as: "subCategory",
                                    pipeline: [
                                        {
                                            $project: {
                                                name: 1,
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: "$subCategory"
                            },
                            {
                                $addFields: {
                                    subCategory: '$subCategory.name'
                                }
                            },
                            {
                                $project: {
                                    createdAt: 0,
                                    updatedAt: 0,
                                    __v: 0
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$items.product"
                },
                {
                    $lookup: {
                        from: 'payments',
                        localField: '_id',
                        foreignField: 'order',
                        as: 'paymentDetails',
                        pipeline: [
                            {
                                $project: {
                                    __v: 0,
                                    createdAt: 0
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$paymentDetails"
                },
                {
                    $group: {
                        _id: "$_id",
                        user: { $first: "$user" },
                        items: {
                            $push: {
                                _id: "$items._id",
                                quantity: "$items.quantity",
                                product: "$items.product",
                                price: "$items.price"
                            }
                        },
                        shippingAddress: {
                            $first: '$shippingAddress'
                        },
                        status: {
                            $first: '$status'
                        },
                        paymentDetails: {
                            $first: '$paymentDetails'
                        },
                        totalAmount: {
                            $first: '$totalAmount'
                        },
                        createdAt: {
                            $first: '$createdAt'
                        },
                        updatedAt: {
                            $first: '$updatedAt'
                        }
                    }
                }
            ]).sort({ 'createdAt': -1 })
        }
        else {
            orders = await Order.aggregate([
                {
                    $match: {}
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "user",
                        pipeline: [
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    email: 1,
                                    phoneNumber: 1,
                                    _id: 1,
                                    username: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $unwind: "$items"
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "items.product",
                        pipeline: [
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
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: "$category"
                            },
                            {
                                $addFields: {
                                    category: '$category.name'
                                }
                            },
                            {
                                $lookup: {
                                    from: "subcategories",
                                    localField: "subCategory",
                                    foreignField: "_id",
                                    as: "subCategory",
                                    pipeline: [
                                        {
                                            $project: {
                                                name: 1,
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: "$subCategory"
                            },
                            {
                                $addFields: {
                                    subCategory: '$subCategory.name'
                                }
                            },
                            {
                                $project: {
                                    createdAt: 0,
                                    updatedAt: 0,
                                    __v: 0
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$items.product"
                },
                {
                    $lookup: {
                        from: 'payments',
                        localField: '_id',
                        foreignField: 'order',
                        as: 'paymentDetails',
                        pipeline: [
                            {
                                $project: {
                                    __v: 0,
                                    createdAt: 0
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$paymentDetails"
                },
                {
                    $group: {
                        _id: "$_id",
                        user: { $first: "$user" },
                        items: {
                            $push: {
                                _id: "$items._id",
                                quantity: "$items.quantity",
                                product: "$items.product",
                                price: "$items.price"
                            }
                        },
                        shippingAddress: {
                            $first: '$shippingAddress'
                        },
                        status: {
                            $first: '$status'
                        },
                        paymentDetails: {
                            $first: '$paymentDetails'
                        },
                        totalAmount: {
                            $first: '$totalAmount'
                        },
                        createdAt: {
                            $first: '$createdAt'
                        },
                        cancellationMessage: {
                            $first: '$cancellationMessage'
                        },
                        updatedAt: {
                            $first: '$updatedAt'
                        }
                    }
                }
            ])
        }

        return res.status(200)
            .json(
                new ApiResponse(200, orders, "Orders fetched successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching orders")
    }
})


const getOrderById = asyncHandler(async (req, res) => {
    try {

        const { orderId } = req.params

        if (!orderId || !isValidObjectId(orderId)) throw new ApiError(400, 'Invalid order ID')

        const orders = await Order.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(orderId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                phoneNumber: 1,
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$user"
            },
            {
                $unwind: "$items"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "items.product",
                    pipeline: [
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
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$category"
                        },
                        {
                            $addFields: {
                                category: '$category.name'
                            }
                        },
                        {
                            $lookup: {
                                from: "subcategories",
                                localField: "subCategory",
                                foreignField: "_id",
                                as: "subCategory",
                                pipeline: [
                                    {
                                        $project: {
                                            name: 1,
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$subCategory"
                        },
                        {
                            $addFields: {
                                subCategory: '$subCategory.name'
                            }
                        },
                        {
                            $project: {
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$items.product"
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'order',
                    as: 'paymentDetails',
                    pipeline: [
                        {
                            $project: {
                                __v: 0,
                                createdAt: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$paymentDetails"
            },

            {
                $group: {
                    _id: "$_id",
                    user: { $first: "$user" },
                    items: {
                        $push: {
                            _id: "$items._id",
                            quantity: "$items.quantity",
                            product: "$items.product",
                            price: "$items.price"
                        }
                    },
                    shippingAddress: {
                        $first: '$shippingAddress'
                    },
                    status: {
                        $first: '$status'
                    },
                    paymentDetails: {
                        $first: '$paymentDetails'
                    },
                    totalAmount: {
                        $first: '$totalAmount'
                    },
                    createdAt: {
                        $first: '$createdAt'
                    },
                    cancellationMessage: {
                        $first: '$cancellationMessage'
                    },
                    updatedAt: {
                        $first: '$updatedAt'
                    }
                }
            }
        ])

        if (!orders || orders.length === 0) throw new ApiError(404, "Order not found")

        return res.status(200)
            .json(
                new ApiResponse(200, orders[0], "Order fetched successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching order")
    }
})

const updateOrderStatus = asyncHandler(async (req, res) => {
    try {

        const { orderId } = req.params
        const { status, message } = req.body

        if (!orderId || !isValidObjectId(orderId)) throw new ApiError(400, "Invalid order Id")

        if (!status) throw new ApiError(400, "Status is required")

        const order = await Order.findById(orderId)

        if (!order) throw new ApiError(404, "Order not found")

        const updatedOrder = await Order.findByIdAndUpdate(orderId,
            {
                status: status,
                cancellationMessage: message
            },
            {
                new: true
            }
        )

        const orders = await Order.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(orderId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                phoneNumber: 1,
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$user"
            },
            {
                $unwind: "$items"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "items.product",
                    pipeline: [
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
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$category"
                        },
                        {
                            $addFields: {
                                category: '$category.name'
                            }
                        },
                        {
                            $lookup: {
                                from: "subcategories",
                                localField: "subCategory",
                                foreignField: "_id",
                                as: "subCategory",
                                pipeline: [
                                    {
                                        $project: {
                                            name: 1,
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$subCategory"
                        },
                        {
                            $addFields: {
                                subCategory: '$subCategory.name'
                            }
                        },
                        {
                            $project: {
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$items.product"
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'order',
                    as: 'paymentDetails',
                    pipeline: [
                        {
                            $project: {
                                __v: 0,
                                createdAt: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$paymentDetails"
            },

            {
                $group: {
                    _id: "$_id",
                    user: { $first: "$user" },
                    items: {
                        $push: {
                            _id: "$items._id",
                            quantity: "$items.quantity",
                            product: "$items.product",
                            price: "$items.price"
                        }
                    },
                    shippingAddress: {
                        $first: '$shippingAddress'
                    },
                    status: {
                        $first: '$status'
                    },
                    paymentDetails: {
                        $first: '$paymentDetails'
                    },
                    totalAmount: {
                        $first: '$totalAmount'
                    },
                    createdAt: {
                        $first: '$createdAt'
                    },
                    cancellationMessage: {
                        $first: '$cancellationMessage'
                    },
                    updatedAt: {
                        $first: '$updatedAt'
                    }
                }
            }
        ])

        const orderMessage = `
        <h2>Your order is ${status}</h2>
        <br/>
        ${updatedOrder.status === "CANCELLED" ? `<p>Cancellation message: ${message}</p>` : ""}
        <br/>
        <p>We will inform you as soon as there is an update about your order.</p>
        `

        const emailData = {
            to: orders[0].user.email ? orders[0].user.email : orders[0].guestUser.email,
            subject: `Order update - Order ID ${order._id}`,
            html: orderMessage
        }

        const mailSent = await sendMail(emailData)

        if (!mailSent.success) throw new Error('Failed to send email')

        return res.status(200)
            .json(
                new ApiResponse(200, orders[0], "Status updated successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to update the order status")
    }
})

export {
    getUserOrders,
    getOrdersByStatus,
    getOrderById,
    updateOrderStatus
}