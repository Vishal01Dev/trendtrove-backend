import Router from 'express'
import { changeUserPassword, checkAuthentication, checkOtp, forgotPassword, getCurrentUser, getUserById, loginUser, logoutUser, registerUser, sendAuthMail, updateUser } from '../../controllers/client/user.controller.js'
import { checkAuth, verifyJWT } from '../../middlewares/auth.middleware.js'

const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/update').patch(verifyJWT, updateUser)
router.route('/u/:userId').get(getUserById)
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/status').get(checkAuth,checkAuthentication)
router.route('/change-password').post(verifyJWT, changeUserPassword)
router.route('/sendmail').post(sendAuthMail)
router.route('/validateotp').post(checkOtp)
router.route('/forgot-password').post(forgotPassword)

export default router