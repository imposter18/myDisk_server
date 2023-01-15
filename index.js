// const express = require("express");
// const mongoose = require("mongoose");
// const config = require("config");
import authRouter from "./routes/authRouter.js";
import config from "config";
import mongoose from "mongoose";
import express from "express";

const app = express();
const PORT = config.get("serverPort");

app.use(express.json());
app.use("/api/auth", authRouter);

const start = async () => {
	try {
		mongoose.set("strictQuery", false);
		await mongoose.connect(config.get("dbUrl"));
		app.listen(PORT, () => {
			console.log("server started on port", PORT);
		});
	} catch (e) {}
};

start();
