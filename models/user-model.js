import mongoose, { Schema, model, ObjectId } from "mongoose";

const UserSchema = new Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	isActivated: { type: Boolean, default: false },
	activationLink: { type: String },
	diskSpace: { type: Number, default: 1024 ** 3 },
	usedSpace: { type: Number, default: 0 },
	avatar: { type: String },
	files: [{ type: Schema.Types.ObjectId, ref: "File" }],
});

export default model("User", UserSchema);
