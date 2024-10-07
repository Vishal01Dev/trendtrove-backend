import Router from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {
  addToCart,
  getCartItems,
  removeFromCart,
  removeWholeCart,
  updateInCart,
} from "../../controllers/client/cart.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/add").post(addToCart);
router.route("/remove/:cartItemId").delete(removeFromCart);
router.route("/update/:cartItemId").patch(updateInCart);
router.route("/get").get(getCartItems);
router.route("/delete").get(removeWholeCart);

export default router;
