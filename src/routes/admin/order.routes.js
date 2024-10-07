import Router from 'express'
import { getOrderById, getOrdersByStatus, getUserOrders, updateOrderStatus } from '../../controllers/admin/order.controller.js'

const router = Router()

router.route('/u/:userId').get(getUserOrders)
router.route('/status/:status').get(getOrdersByStatus)
router.route('/orderDetail/:orderId').get(getOrderById)
router.route('/status/:orderId').patch(updateOrderStatus)

export default router