import Router from "express";
import {
  addAdmin,
  checkAuthentication,
  getAdminDetails,
  loginAdmin,
  logoutAdmin,
  updateAdmin,
} from "../../controllers/admin/admin.contoller.js";
import {
  checkAuth,
  verifyAdminJWT,
  verifyJWT,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.route("/add").post(addAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyAdminJWT, logoutAdmin);
router.route("/status").get(checkAuth, checkAuthentication);
router.route("/current-admin").get(verifyAdminJWT, getAdminDetails);
router.route("/update/:adminId").post(verifyAdminJWT, updateAdmin);

export default router;
