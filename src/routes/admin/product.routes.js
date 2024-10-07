import Router from 'express'
import { upload } from '../../middlewares/multer.middleware.js'
import { addProduct, deleteProduct, getAllProducts, getProductDetailsById, toggleProductStatus, updateProduct, updateProductImage } from '../../controllers/admin/product.controller.js'

const router = Router()

router.route('/add').post(upload.single('image'), addProduct)
router.route('/g/:productId').get(getProductDetailsById)
router.route('/update/:productId').patch(updateProduct)
router.route('/delete/:productId').delete(deleteProduct)
router.route('/status/:productId').patch(toggleProductStatus)
router.route('/update-image/:productId').patch(upload.single('image'), updateProductImage)
router.route('/get-all').get(getAllProducts)

export default router