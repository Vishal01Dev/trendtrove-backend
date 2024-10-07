import Router from "express";
import { getAllFilters } from "../../controllers/client/filters.controller.js";

const router = Router();

router.route("/").get(getAllFilters);

export default router;
