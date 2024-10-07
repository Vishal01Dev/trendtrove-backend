import { Router } from "express";
import { findCategoryById, getAllActiveCategories } from "../../controllers/client/category.controller.js";

const router = Router()

router.route('/get-all').get(getAllActiveCategories)
router.route('/g/:categoryId').get(findCategoryById)

export default router