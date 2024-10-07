import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("*", cors());

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

import clientUserRouter from "./routes/client/user.routes.js";
import adminUserRouter from "./routes/admin/user.routes.js";
import adminCategoryRouter from "./routes/admin/category.routes.js";
import clientCategoryRouter from "./routes/client/category.routes.js";
import adminSubCategoryRouter from "./routes/admin/subCategory.routes.js";
import clientSubCategoryRouter from "./routes/client/subCategory.routes.js";
import adminProductRouter from "./routes/admin/product.routes.js";
import clientProductRouter from "./routes/client/product.routes.js";
import cartRouter from "./routes/client/cart.routes.js";
import clientReviewRouter from "./routes/client/review.routes.js";
import adminReviewRouter from "./routes/admin/review.routes.js";
import clientOrderRouter from "./routes/client/order.routes.js";
import adminOrderRouter from "./routes/admin/order.routes.js";
import clientQueryRouter from "./routes/client/query.routes.js";
import adminQueryRouter from "./routes/admin/query.routes.js";
import adminAuthRouter from "./routes/admin/admin.routes.js";
import filtersRouter from "./routes/client/filters.routes.js";
import wishlistRouter from "./routes/client/wishlist.routes.js";
import paymentRouter from "./routes/client/payment.routes.js";

app.use("/api/users", clientUserRouter, adminUserRouter);
app.use("/api/category", adminCategoryRouter, clientCategoryRouter);
app.use("/api/subcategory", adminSubCategoryRouter, clientSubCategoryRouter);
app.use("/api/products", adminProductRouter, clientProductRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/filters", filtersRouter);
app.use("/api/reviews", clientReviewRouter, adminReviewRouter);
app.use("/api/orders", clientOrderRouter, adminOrderRouter);
app.use("/api/queries", clientQueryRouter, adminQueryRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/payment", paymentRouter);

export { app };
