import mongoose, { Schema, model } from "mongoose";

const File = new Schema({
	name: { type: String, required: true },
	type: { type: String, required: true },
	accessLink: { type: String },
	size: { type: Number, default: 0 },
	path: { type: String, default: "" },
	date: { type: Date },
	user: { type: Schema.Types.ObjectId, ref: "User" },
	parent: { type: Schema.Types.ObjectId, ref: "File" },
	childs: [{ type: Schema.Types.ObjectId, ref: "File" }],
	uploadId: { type: String },
});
export default model("File", File);
