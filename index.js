import dotenv from "dotenv";
dotenv.config({ silent: true });
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import express from "express";
import router from "./router/index.js";
import errorMiddleware from "./middlewares/error-middleware.js";
import fileUpload from "express-fileupload";
const PORT = process.env.PORT || 5000;
const URL = process.env.DB_URL;

function setCustomCacheControl(res) {
	res.setHeader("Cache-Control", "public, max-age='1d");
}

const app = express();

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
		optionSuccessStatus: 200,
		allowedHeaders: ["Content-Type", "*Content-Type", "Authorization"],
	})
);
app.use(cookieParser());

app.use(express.json());

app.use(fileUpload({}));

app.use("/api", router);

app.use(
	"/api/files",
	express.static("files", {
		setHeaders: setCustomCacheControl,
	})
);

app.use(errorMiddleware);

const start = async () => {
	try {
		mongoose.set("strictQuery", false);
		mongoose.connect(URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		app.listen(PORT, () => {
			console.log("server started on PORT =", PORT);
		});
	} catch (e) {
		console.log(e);
	}
};

start();
