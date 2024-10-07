import { Router } from "express";
import { createOrder, getOrderDetails, getUserOrders } from "../../controllers/client/order.controller.js";
import { verifyJWT } from '../../middlewares/auth.middleware.js'

const router = Router()

router.route('/create').post(createOrder)
router.route('/get/:orderId').get(getOrderDetails)
router.route('/user-orders').get(verifyJWT, getUserOrders)

export default router