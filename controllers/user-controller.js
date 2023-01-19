import * as dotenv from "dotenv";
dotenv.config();
import userService from "../service/user-service.js";
import UserService from "../service/user-service.js";

class UserController {
	async registration(req, res, next) {
		try {
			const { email, password, userName } = req.body;
			const userData = await userService.registration(
				email,
				password,
				userName
			);
			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 36 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			console.log(e);
		}
	}
	async login(req, res, next) {
		try {
		} catch (e) {}
	}
	async logout(req, res, next) {
		try {
		} catch (e) {}
	}
	async refresh(req, res, next) {
		try {
		} catch (e) {}
	}
	async activate(req, res, next) {
		try {
			const activationLink = req.params.link;
			await userService.activate(activationLink);
			return res.redirect(process.env.CLIENT_URL);
		} catch (e) {
			console.log(e);
		}
	}
	async getUsers(req, res, next) {
		try {
			res.json(["123", "fdss"]);
		} catch (e) {}
	}
}

export default new UserController();
