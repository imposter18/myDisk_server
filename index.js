import dotenv from "dotenv";
dotenv.config({ silent: true });
import cookieParser from "cookie-parser";
// import authRouter from "./router/authRouter.js";
import cors from "cors";
import mongoose from "mongoose";
import express from "express";
import router from "./router/index.js";
import errorMiddleware from "./middlewares/error-middleware.js";
import corsMiddleware from "./middlewares/core-middleware.js";
import fileUpload from "express-fileupload";
// import * as cors from "cors";

const PORT = process.env.DB_PORT || 5000;
const URL = process.env.DB_URL;

const app = express();

// app.use(
// 	cors({
// 		origin: "http://localhost:8080",
// 		methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
// 		credentials: true,
// 	})
// );
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
		optionSuccessStatus: 200,
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

// app.use(corsMiddleware);
app.use(fileUpload({}));
app.use(express.json());
app.use(cookieParser());
// app.use(cors());
app.use("/api", router);

app.use(errorMiddleware);

const start = async () => {
	try {
		mongoose.set("strictQuery", false);
		await mongoose.connect(URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		app.listen(PORT, () => {
			console.log("server started on PORT=", PORT);
		});
	} catch (e) {
		console.log(e);
	}
};

start();
