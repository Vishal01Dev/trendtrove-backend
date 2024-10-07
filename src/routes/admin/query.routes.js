import Router from 'express'
import { getAllQueries, replyQuery } from '../../controllers/admin/query.controller.js'

const router = Router()


router.route('/all').get(getAllQueries)
router.route('/reply/:queryId').patch(replyQuery)

export default router