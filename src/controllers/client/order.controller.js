import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Order } from "../../models/order.model.js";
import { Payment } from "../../models/payment.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const createOrder = asyncHandler(async (req, res) => {
  let {
    user,
    guestUser,
    totalAmount,
    items,
    shippingAddress,
    billingAddress,
    paymentToken,
    paymentMethod = "PAYPAL",
  } = req.body;

  if (!user && !guestUser)
    throw new ApiError(400, "Provide the customer details");

  if (!totalAmount)
    throw new ApiError(400, "Please provide the amount of the order");

  if (!items || items.length === 0)
    throw new ApiError(400, "Provide the items that you need to order");

  if (!shippingAddress)
    throw new ApiError(400, "Please provide shipping address");

  if (!billingAddress)
    throw new ApiError(400, "Please provide billing address");

  if (!paymentMethod)
    throw new ApiError(400, "Please select one payment method");

  if (!paymentToken)
    throw new ApiError(
      400,
      "Please provide payment token or transaction token"
    );

  const orderItems = items.map((i) => {
    return {
      price: i.product.price,
      quantity: i.quantity,
      productId: i.product._id,
    };
  });

  const order = await Order.create({
    user: user && user,
    guestUser: guestUser && guestUser,
    totalAmount,
    items: orderItems,
    shippingAddress,
    billingAddress,
  });

  if (!order) throw new ApiError(500, "Failed to create order");

  const paymentDetails = await Payment.create({
    order: order?._id,
    amount: totalAmount,
    paymentMethod,
    paymentToken,
  });

  if (!paymentDetails)
    throw new ApiError(500, "Failed to generate payment intent");

  const orderObj = {
    user: order?.user,
    guestUser: order?.guestUser,
    totalAmount: order?.totalAmount,
    items,
    shippingAddress: order?.shippingAddress,
    billingAddress: order?.billingAddress,
    paymentDetails,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, orderObj, "Order created successfully"));
});

const getOrderDetails = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !isValidObjectId(orderId))
      throw new ApiError(400, "Invalid order id");

    const orderDetails = await Order.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId),
        },
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
                firstName: 1,
                lastName: 1,
                email: 1,
                phoneNumber: 1,
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$user",
      },
      {
        $unwind: "$items",
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
                    },
                  },
                ],
              },
            },
            {
              $unwind: "$category",
            },
            {
              $addFields: {
                category: "$category.name",
              },
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
                    },
                  },
                ],
              },
            },
            {
              $unwind: "$subCategory",
            },
            {
              $addFields: {
                subCategory: "$subCategory.name",
              },
            },
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                __v: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$items.product",
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
              price: "$items.price",
              image: "$items.image",
            },
          },
          shippingAddress: {
            $first: "$shippingAddress",
          },
          billingAddress: {
            $first: "$billingAddress",
          },
          status: {
            $first: "$status",
          },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const paymentDetails = await Payment.findOne({
      order: orderId,
    }).select("-createdAt -updatedAt -_id -__v");

    const orderObj = {
      orderDetails: orderDetails.length > 0 && orderDetails[0],
      paymentDetails,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, orderObj, "Order details fetched successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching the order details"
    );
  }
});

const getUserOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId))
      throw new ApiError(401, "Unauthorized request");

    const orders = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
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
                firstName: 1,
                lastName: 1,
                email: 1,
                phoneNumber: 1,
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$user",
      },
      {
        $unwind: "$items",
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
                    },
                  },
                ],
              },
            },
            {
              $unwind: "$category",
            },
            {
              $addFields: {
                category: "$category.name",
              },
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
                    },
                  },
                ],
              },
            },
            {
              $unwind: "$subCategory",
            },
            {
              $addFields: {
                subCategory: "$subCategory.name",
              },
            },
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                __v: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$items.product",
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "order",
          as: "paymentDetails",
          pipeline: [
            {
              $project: {
                __v: 0,
                createdAt: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$paymentDetails",
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
              price: "$items.price",
            },
          },
          shippingAddress: {
            $first: "$shippingAddress",
          },
          status: {
            $first: "$status",
          },
          paymentDetails: {
            $first: "$paymentDetails",
          },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders fetched successfully!"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching all user orders"
    );
  }
});

export { createOrder, getOrderDetails, getUserOrders };
