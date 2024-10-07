import Router from 'express'
import { addSubCategory, deleteSubCategory, getAllSubCategories, toggleSubCategoryStatus, updateSubCategory } from '../../controllers/admin/subCategory.controller.js'

const router = Router()

router.route('/add').post(addSubCategory)
router.route('/all').get(getAllSubCategories)
router.route('/status/:subCategoryId').patch(toggleSubCategoryStatus)
router.route('/update/:subCategoryId').patch(updateSubCategory)
router.route('/delete/:subCategoryId').delete(deleteSubCategory)

export default router