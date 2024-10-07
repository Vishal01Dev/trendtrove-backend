import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { Product } from '../../models/product.model.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import mongoose, { isValidObjectId } from 'mongoose'
import { deleteFromCloudinary, uploadOnCloudinary } from '../../utils/cloudinary.js'

const addProduct = asyncHandler(async (req, res) => {

    try {

        console.log(req.body)

        let {
            name,
            description,
            price,
            stock,
            categoryId,
            subCategoryId,
            sizes,
            colors,
            material,
            style,
            tags
        } = req.body

        if ([
            name,
            description,
            price,
            stock,
            categoryId,
            subCategoryId,
            material,
            style
        ].some(field => field === field?.trim() === "")) {
            throw new ApiError(400, "Missing some required fields")
        }

        if ((sizes?.length || colors?.length || tags?.length) === 0) {
            throw new ApiError(400, "At least one size, color or tag must be provided.")
        }

        sizes = sizes.toUpperCase().split(',')
        tags = tags.split(',')
        colors = colors.split(',')

        if (!isValidObjectId(categoryId) || !isValidObjectId(subCategoryId)) {
            throw new ApiError(422, "Invalid Category/Sub Category ID Provided!")
        }

        const imagePath = req.file?.path

        if (!imagePath) {
            throw new ApiError(400, "No Image Uploaded!")
        }

        const folderPath = 'trendtrove/products'

        const image = await uploadOnCloudinary(imagePath, folderPath)

        if (!image) {
            throw new ApiError(500, "Image could not be uploaded to Cloudinary!")
        }



        const product = await Product.create(
            {
                name,
                description,
                price,
                stock,
                category: categoryId,
                subCategory: subCategoryId,
                sizes,
                colors,
                material,
                style,
                tags,
                image: image?.url
            }
        )

        if (!product) {
            throw new ApiError(500, "Failed to create the product!")
        }


        return res.status(201)
            .json(
                new ApiResponse(201, product, "Product added successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while adding the product")
    }

})

const updateProduct = asyncHandler(async (req, res) => {
    try {

        const {
            name,
            description,
            price,
            stock,
            categoryId,
            subCategoryId,
            sizes,
            colors,
            material,
            style,
            tags
        } = req.body


        const { productId } = req.params

        if (!productId || !isValidObjectId(productId)) {
            throw new ApiError(400, 'Invalid Product ID')
        }

        if ([
            name,
            description,
            price,
            stock,
            categoryId,
            subCategoryId,
            material,
            style
        ].some(field => field === field?.toString().trim() === "")) {
            throw new ApiError(400, "Missing some required fields")
        }

        if ((sizes?.length || colors?.length || tags?.length) === 0) {
            throw new ApiError(400, "At least one size, color or tag must be provided.")
        }


        if (!isValidObjectId(categoryId) || !isValidObjectId(subCategoryId)) {
            throw new ApiError(400, "Invalid Category/Sub Category ID Provided!")
        }


        const product = await Product.findById(productId)

        if (!product) {
            throw new ApiError(404, "Product not found")
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId,
            {
                name,
                description,
                price,
                stock,
                category: categoryId,
                subCategory: subCategoryId,
                sizes: sizes && sizes,
                colors: colors && colors,
                material,
                style,
                tags: tags && tags
            },
            {
                new: true
            }
        )

        if (!updatedProduct) {
            throw new ApiError(500, "Server Error while updating the product")
        }


        return res.status(200)
            .json(
                new ApiResponse(200, updatedProduct, "Successfully Updated The Product")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating the product")
    }

})


const deleteProduct = asyncHandler(async (req, res) => {

    try {

        const { productId } = req.params

        if (!productId || !isValidObjectId(productId)) {
            throw new ApiError(400, 'Invalid Product ID')
        }


        const isAvailable = await Product.findById(productId)

        if (!isAvailable) {
            throw new ApiError(404, 'No Such Product Available')
        }

        const imagePath = isAvailable?.image

        if (imagePath !== "") {
            const oldPublicId = imagePath.split('/').pop().split('.')[0];
            await deleteFromCloudinary(`trendtrove/products/${oldPublicId}`);
        }

        await Product.deleteOne({
            _id: productId
        })

        res.status(200)
            .json(
                new ApiResponse(200, isAvailable, "Product deleted successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while deleting the product")
    }

})

const toggleProductStatus = asyncHandler(async (req, res) => {
    try {

        const { productId } = req.params

        if (!productId || !isValidObjectId(productId)) {
            throw new ApiError(400, 'Invalid Product Id')
        }

        const product = await Product.findById(productId)

        if (!product) {
            throw new ApiError(404, 'Product not found')
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId,
            {
                isActive: !product?.isActive
            },
            {
                new: true
            }
        )

        if (!updatedProduct) {
            throw new ApiError(500, 'Failed to update product status')
        }

        return res.status(200)
            .json(
                new ApiResponse(200, updatedProduct, "Status updated successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating the product status")
    }
})

const getAllProducts = asyncHandler(async (req, res) => {
    try {

        const products = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 0
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'subCategory',
                    foreignField: '_id',
                    as: "subCategory",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 0
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$subCategory'
            },
            {
                $unwind: '$category'
            },
            {
                $addFields: {
                    category: '$category.name',
                    subCategory: '$subCategory.name',
                }
            }
        ]).sort({ createdAt: -1 });

        if (!products || products.length === 0) {
            throw new ApiError(404, 'No products available in database')
        }

        return res.status(200)
            .json(
                new ApiResponse(200, products, "Products fetched successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching all products")
    }
})


const getProductDetailsById = asyncHandler(async (req, res) => {

    try {

        const { productId } = req.params

        if (!productId || !isValidObjectId(productId)) {
            throw new ApiError(400, "Invalid product ID")
        }

        const product = await Product.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(productId),
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$category'
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'subCategory',
                    foreignField: '_id',
                    as: "subCategory",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$subCategory'
            },
            {
                $addFields: {
                    category: '$category.name',
                    categoryId: '$category._id',
                    subCategory: '$subCategory.name',
                    subCategoryId: '$subCategory._id',
                }
            }
        ])

        if (!product || product.length === 0) {
            throw new ApiError(404, "Product not found")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, product[0], "Product fetched successfully")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching the product")
    }
})


const updateProductImage = asyncHandler(async (req, res) => {
    try {


        const imagePath = req.file?.path
        const { productId } = req.params

        if (!imagePath) {
            throw new ApiError(400, "No Image Uploaded!")
        }

        if (!productId || !isValidObjectId(productId)) {
            throw new ApiError(422, "Invalid product ID Provided!")
        }

        const product = await Product.findById(productId)

        if (!product) {
            throw new ApiError(404, "Product Not Found!")
        }

        const oldImageUrl = product.image;
        const oldPublicId = oldImageUrl.split('/').pop().split('.')[0];


        await deleteFromCloudinary(oldPublicId);

        const folderPath = 'trendtrove/products'

        const image = await uploadOnCloudinary(imagePath, folderPath)

        if (!image) {
            throw new ApiError(500, "Image could not be uploaded to Cloudinary!")
        }

        product.image = image?.url
        await product.save()


        return res.status(200)
            .json(
                new ApiResponse(200, product, "Image updated successfully!")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating product image")
    }
})

export {
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getAllProducts,
    getProductDetailsById,
    updateProductImage
}