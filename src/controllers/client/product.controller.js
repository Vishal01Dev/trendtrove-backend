import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllActiveProducts = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      query,
      sortBy,
      sortType,
      categories,
      subcategory,
      color,
      tags,
      size,
      rating,
      minPrice,
      maxPrice
    } = req.query;

    let matchStage = {
      isActive: true,
    };

    if (query) {
      matchStage.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ];
    }

    if (categories && categories.split(",").length > 0) {
      matchStage.category = {
        $in: categories.split(",").map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (subcategory && subcategory.split(",").length > 0) {
      matchStage.subCategory = {
        $in: subcategory
          .split(",")
          .map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (color && color.split(",").length > 0) {
      matchStage.colors = { $in: color.split(",") };
    }

    if (tags && tags.split(",").length > 0) {
      matchStage.tags = { $in: tags.split(",") };
    }

    if (size && size.length > 0) {
      matchStage.sizes = { $in: size.toUpperCase().split(",") };
    }

    if (rating && !isNaN(rating)) {
      matchStage.rating = { $gte: parseInt(rating) };
    }

    if (minPrice && !isNaN(minPrice) && maxPrice && !isNaN(maxPrice)) {
      matchStage.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
    } else if (minPrice && !isNaN(minPrice)) {
      matchStage.price = { $gte: parseFloat(minPrice) };
    } else if (maxPrice && !isNaN(maxPrice)) {
      matchStage.price = { $lte: parseFloat(maxPrice) };
    }

    let sortStage = {};
    if (sortBy) {
      sortStage[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
      sortStage.createdAt = -1;
    }



    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: "$category" },
      { $addFields: { category: "$category.name" } },
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: "$subCategory" },
      { $addFields: { subCategory: "$subCategory.name" } },

      { $sort: sortStage },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ];

    const products = await Product.aggregate(pipeline);

    const totalProducts = await Product.countDocuments(matchStage);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { products, totalProducts },
          "Products fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching the products"
    );
  }
});

const getProductById = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !isValidObjectId(productId)) {
      throw new ApiError(400, "Invalid product ID");
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching the product"
    );
  }
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId || !isValidObjectId(categoryId)) {
      throw new ApiError(400, "Invalid Category Id");
    }

    const products = await Product.find({
      category: categoryId,
    });

    if (!products || products.length === 0) {
      throw new ApiError(404, "No products in this category");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products Fetched Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "Something went wrong while fetching the product by category"
    );
  }
});

const getProductsBySubCategory = asyncHandler(async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    if (!subCategoryId || !isValidObjectId(subCategoryId)) {
      throw new ApiError(400, "Invalid sub Category Id");
    }

    const products = await Product.find({
      subCategory: subCategoryId,
    });

    if (!products || products.length === 0) {
      throw new ApiError(404, "No products in this category");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products Fetched Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "Something went wrong while fetching the product by sub category"
    );
  }
});

export {
  getAllActiveProducts,
  getProductById,
  getProductsBySubCategory,
  getProductsByCategory,
};
