import Router from 'express'
import { getAllUserDetailsById, getAllUsers } from '../../controllers/admin/user.controller.js'

const router = Router()

router.route('/all').get(getAllUsers)
router.route('/details/:userId').get(getAllUserDetailsById)

export default router