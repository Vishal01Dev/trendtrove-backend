import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import cors from "cors";

const port = process.env.PORT || 8000;

dotenv.config({
  path: "./.env",
});



connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("ERROR: ", err);
      throw err;
    });

    app.listen(port, () => {
      console.log(`App is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("ERROR: " + err);
  });
