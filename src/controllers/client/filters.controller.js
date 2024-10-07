import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Category } from "../../models/category.model.js";
import { Product } from "../../models/product.model.js";

const getAllFilters = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "category",
          as: "subcategories",
          pipeline: [
            {
              $match: {
                isActive: true,
              },
            },
            {
              $project: {
                name: 1,
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          name: 1,
          _id: 1,
          subcategories: 1,
        },
      },
    ]);

    const products = await Product.find();

    const sizes = [...new Set(products.flatMap((product) => product.sizes))];

    const colors = [...new Set(products.flatMap((product) => product.colors))];

    const prices = await Product.aggregate([
        {
          $group: {
            _id: null,
            highestPrice: { $max: "$price" },
            lowestPrice: { $min: "$price" }
          }
        }
      ]);

    const filters = {
      categories,
      sizes,
      colors,
      lowestPrice : prices[0].lowestPrice,
      highestPrice: prices[0].highestPrice
    };

    return res
      .status(200)
      .json(new ApiResponse(200, filters, "filters fetched successfully!"));

  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching filters"
    );
  }
});

export { getAllFilters };
