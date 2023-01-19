// const User =require('../models/User')
import { Router } from "express";
import User from "../models/user-model.js";
import bcrypt from "bcryptjs";

const authRouter = new Router();

authRouter.post("/registration", async (req, res) => {
	try {
		const { email, password, userName } = req.body;
		const candidate = await User.findOne({ email });
		if (candidate) {
			return res
				.status(400)
				.json({ message: `User with email ${email} already exist` });
		}
		const hashPassword = await bcrypt.hash(password, 15);
		const user = new User({ userName, email, password: hashPassword });
		await user.save();
		return res.json({ message: `User was created` });
	} catch (e) {
		console.log(e);
		res.send({ message: "Server error" });
	}
});
export default authRouter;
