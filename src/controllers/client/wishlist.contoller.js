import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Wishlist } from "../../models/wishlist.model.js";

const addToWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;

    const userId = req.user?._id;

    if (!productId || !isValidObjectId(productId)) {
      throw new ApiError(401, "Invalid Product ID");
    }

    if (!userId) {
      throw new ApiError(403, "User not authenticated.");
    }

    const existingWishlist = await Wishlist.findOne({
      user: userId,
    });

    if (existingWishlist) {
      const existitngWishlistItem = existingWishlist.items.find((i) =>
        i.productId.equals(productId)
      );
      if (existitngWishlistItem) {
        new ApiResponse(200, "Item already added!");
      } else {
        existingWishlist.items.push({ productId });
      }
      await existingWishlist.save();
      return res
        .status(201)
        .json(
          new ApiResponse(201, existingWishlist, "Item added successfully!")
        );
    } else {
      const newWishlist = new Wishlist({
        user: userId,
        items: [{ productId }],
      });
      await newWishlist.save();

      return res
        .status(201)
        .json(new ApiResponse(201, newWishlist, "Item added successfully!"));
    }
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while adding item to the wishlist"
    );
  }
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  try {
    const { wishlistItemId } = req.params;
    const userId = req.user?._id;

    if (!wishlistItemId || !isValidObjectId(wishlistItemId)) {
      throw new ApiError(400, "Invalid wishlist id");
    }

    if (!userId || !isValidObjectId(userId)) {
      throw new ApiError(403, "You must be logged in to perform this action.");
    }

    const isExist = await Wishlist.findOne({
      user: userId,
      "items._id": wishlistItemId,
    });

    if (!isExist) {
      throw new ApiError(404, "Wishlist item not found.");
    }

    if (isExist?.user?.toString() !== userId.toString()) {
      throw new ApiError(403, "This wishlist item does not belong to you.");
    }

    await Wishlist.updateOne(
      { user: userId },
      { $pull: { items: { _id: wishlistItemId } } }
    );


    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Item has been removed from your wishlist"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while removing your wishlist item"
    );
  }
});

const getWishlistByUserId = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId)) {
      throw new ApiError(403, "Unauthorized request");
    }

    const wishlist = await Wishlist.aggregate([
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
              product: "$items.product",
            },
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, wishlist[0], "Wishlist items fetched successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching wishlist"
    );
  }
});

export { addToWishlist, removeFromWishlist, getWishlistByUserId };
