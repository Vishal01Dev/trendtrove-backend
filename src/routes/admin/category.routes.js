import { Router } from "express";
import { addCategory, deleteCategory, getAllCategories, toggleCategoryStatus, updateCategory } from '../../controllers/admin/category.controller.js'

const router = Router()


router.route('/add').post(addCategory)
router.route('/all').get(getAllCategories)
router.route('/status/:categoryId').patch(toggleCategoryStatus)
router.route('/update/:categoryId').patch(updateCategory)
router.route('/delete/:categoryId').delete(deleteCategory)

export default router