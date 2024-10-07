import Router from 'express'
import { getAllActiveProducts, getProductById, getProductsByCategory, getProductsBySubCategory } from '../../controllers/client/product.controller.js'

const router = Router()

router.route('/all').get(getAllActiveProducts)
router.route('/p/:productId').get(getProductById)
router.route('/c/:categoryId').get(getProductsByCategory)
router.route('/sc/:subCategoryId').get(getProductsBySubCategory)

export default router