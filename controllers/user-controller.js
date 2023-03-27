import * as dotenv from "dotenv";
dotenv.config();
import userService from "../service/user-service.js";
import { validationResult } from "express-validator";
import ApiError from "../exeptions/api-error.js";
import userModel from "../models/user-model.js";
import fileModel from "../models/file-model.js";
import UserDto from "../dtos/user-dto.js";

class UserController {
	async registration(req, res, next) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return next(ApiError.BadRequest("Validation error", errors.array()));
			}
			const { email, password } = req.body;

			const userData = await userService.registration(email, password);
			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 36 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			next(e);
		}
	}
	async login(req, res, next) {
		try {
			const { email, password } = req.body;
			const userData = await userService.login(email, password);
			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 36 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			next(e);
		}
	}
	async logout(req, res, next) {
		try {
			const { refreshToken } = req.cookies;
			const token = await userService.logout(refreshToken);
			res.clearCookie("refreshToken");
			return res.json(token);
		} catch (e) {
			next(e);
		}
	}
	async refresh(req, res, next) {
		try {
			const { refreshToken } = req.cookies;
			const userData = await userService.refresh(refreshToken);
			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 36 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			next(e);
		}
	}
	async activate(req, res, next) {
		try {
			const activationLink = req.params.link;
			await userService.activate(activationLink);
			return res.redirect(process.env.CLIENT_URL);
		} catch (e) {
			next(e);
		}
	}
	async getUserSpace(req, res, next) {
		try {
			const user = await userModel.findById(req.user.id);
			const allUserFiles = await fileModel.find({ user: req.user.id });
			const size = allUserFiles.reduce((sum, current) => {
				return sum + current.size;
			}, 0);
			user.usedSpace = size;
			user.save();
			const userDto = new UserDto(user);
			res.json(userDto);
		} catch (e) {
			next(e);
		}
	}
}

export default new UserController();
