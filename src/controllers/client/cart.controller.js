import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Cart } from "../../models/cart.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const addToCart = asyncHandler(async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const userId = req.user?._id;

    if (!productId || !isValidObjectId(productId)) {
      throw new ApiError(400, "Invalid Product ID");
    }

    if (!userId) {
      throw new ApiError(403, "User not authenticated.");
    }

    const existingCart = await Cart.findOne({
      user: userId,
    });

    if (existingCart) {
      const existitngCartItem = existingCart.items.find((i) =>
        i.productId.equals(productId)
      );
      if (existitngCartItem) {
        existitngCartItem.quantity += quantity;
      } else {
        existingCart.items.push({ productId, quantity });
      }
      await existingCart.save();
      return res
        .status(201)
        .json(new ApiResponse(201, existingCart, "Item added successfully!"));
    } else {
      const newCart = new Cart({
        user: userId,
        items: [{ productId, quantity }],
      });

      await newCart.save();

      return res
        .status(201)
        .json(new ApiResponse(201, newCart, "Item added successfully!"));
    }
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while adding item to the cart"
    );
  }
});

const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user?._id;

    if (!cartItemId || !isValidObjectId(cartItemId)) {
      throw new ApiError(400, "Invalid cart id");
    }

    if (!userId || !isValidObjectId(userId)) {
      throw new ApiError(403, "You must be logged in to perform this action.");
    }

    const isExist = await Cart.findOne({
      user: userId,
      "items._id": cartItemId,
    });

    if (!isExist) {
      throw new ApiError(404, "Cart item not found.");
    }

    if (isExist?.user?.toString() !== userId.toString()) {
      throw new ApiError(403, "This cart item does not belong to you.");
    }

    await Cart.updateOne(
      { user: userId },
      { $pull: { items: { _id: cartItemId } } }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Item has been removed from your cart"));
      
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while removing your cart item"
    );
  }
});

const updateInCart = asyncHandler(async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    const userId = req.user?._id;

    if (!cartItemId || !isValidObjectId(cartItemId))
      throw new ApiError(400, "Invalid cart item ID provided.");

    if (!userId || !isValidObjectId(userId))
      throw new ApiError(400, "Unauthorized request.");

    let searchCartItem = await Cart.findOne({
      user: userId,
      "items._id": cartItemId,
    });

    if (!searchCartItem) {
      throw new ApiError(404, "No such a product in the shopping cart");
    }

    const updatedCartItem = await Cart.findOneAndUpdate(
      {
        user: userId,
        "items._id": cartItemId,
      },
      {
        $set: {
          "items.$.quantity": quantity,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedCartItem) {
      throw new ApiError(500, "Failed to update the cart item");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCartItem, "Cart item updated successfully!")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while removing the cart"
    );
  }
});

const getCartItems = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId))
      throw new ApiError(400, "Unauthorized request.");

    const cartItems = await Cart.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
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
            },
          },
        },
      },
    ]);

    const items = cartItems[0]?.items;

    let carTotal = 0;

    if (items?.length > 0) {
      carTotal = items.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.product.price * currentValue.quantity;
      }, 0);
    }

    const obj = {
      cartItems: cartItems[0] ? cartItems[0] : {},
      cartTotal: Number(carTotal.toFixed(2)),
    };

    return res
      .status(200)
      .json(new ApiResponse(200, obj, "Cart items fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "Something went wrong while fetching items from the cart"
    );
  }
});

const removeWholeCart = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId))
      throw new ApiError(400, "Unauthorized request.");

    const isExist = await Cart.find({
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!isExist || isExist.length == 0) {
      throw new ApiError(400, "Cart not found!");
    }

    await Cart.deleteOne({
      user: new mongoose.Types.ObjectId(userId),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Cart items fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "Something went wrong while fetching items from the cart"
    );
  }
});

export {
  addToCart,
  removeFromCart,
  updateInCart,
  getCartItems,
  removeWholeCart,
};
