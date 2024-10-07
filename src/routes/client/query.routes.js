import Router from 'express'
import { addQuery } from '../../controllers/client/query.controller.js'

const router = Router()


router.route('/add').post(addQuery)

export default router