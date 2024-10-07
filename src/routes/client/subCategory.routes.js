import Router from 'express'
import { findSubCategoryById, getAllActiveSubCategories } from '../../controllers/client/subCategory.controller.js'

const router = Router()

router.route('/get-all').get(getAllActiveSubCategories)
router.route('/g/:subCategoryId').get(findSubCategoryById)


export default router