import Router from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {
  addToWishlist,
  getWishlistByUserId,
  removeFromWishlist,
} from "../../controllers/client/wishlist.contoller.js";

const router = Router();

router.use(verifyJWT);

router.route("/add").post(addToWishlist);
router.route("/remove/:wishlistItemId").delete(removeFromWishlist);
router.route("/all").get(getWishlistByUserId);

export default router;
