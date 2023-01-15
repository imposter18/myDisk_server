import { Schema, model, ObjectId } from "mongoose";
import mongoose from "mongoose";
const User = new Schema({
	email: { type: String, required: true, unique: true },
	userName: { type: String, required: true },
	password: { type: String, required: true },
	diskSpace: { type: Number, default: 1024 ** 3 * 10 },
	userSpace: { type: Number, default: 0 },
	avatar: { type: String },
	files: [{ type: mongoose.Types.ObjectId, ref: "File" }],
});

export default model("User", User);
