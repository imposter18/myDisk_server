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
import { filePathMiddleware } from "./middlewares/path-auth-middleware.js";
import { fileURLToPath } from "url";
import { pathToServer } from "./default.js";

const PORT = process.env.PORT || 5000;
const URL = process.env.DB_URL;

const app = express();

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
		optionSuccessStatus: 200,
		allowedHeaders: ["Content-Type", "*Content-Type", "Authorization"],
	})
);

app.use(filePathMiddleware(path.dirname(fileURLToPath(import.meta.url))));
app.use(fileUpload({}));
app.use(express.json());
app.use(cookieParser());
app.use(
	"/api/files",
	express.static(`${pathToServer}\\${"files"}`, {
		setHeaders: setCustomCacheControl,
	})
);
app.use("/api", router);
app.use(errorMiddleware);

function setCustomCacheControl(res) {
	res.setHeader("Cache-Control", "public, max-age='1h'");
}

const start = async () => {
	try {
		mongoose.set("strictQuery", false);
		await mongoose.connect(URL, {
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
