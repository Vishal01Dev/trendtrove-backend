import { Router } from "express";
import { getAllReviews } from "../../controllers/admin/review.controller.js";

const router = Router()


router.route('/all').get(getAllReviews)

export default router