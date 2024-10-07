import { Router } from "express";
import { verifyJWT } from '../../middlewares/auth.middleware.js'
import { addReview, deleteReview, getReviewsByProduct } from "../../controllers/client/review.controller.js";

const router = Router()

router.route('/add/:productId').post(verifyJWT,addReview)
router.route('/remove/:reviewId').delete(verifyJWT,deleteReview)
router.route('/p/:productId').get(verifyJWT,getReviewsByProduct)

export default router